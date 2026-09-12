import React, { useEffect, useMemo, useRef, useState } from "react";

import api from "../../services/api";
import chatService from "../../services/chatService";

export default function ChatPage() {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messageText, setMessageText] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [connected, setConnected] = useState(false);

  const websocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* ==========================================================
     LOAD CURRENT USER + USERS + CONVERSATIONS
     ========================================================== */

  useEffect(() => {
    loadChatData();

    return () => {
      closeWebSocket();
    };
  }, []);

  const loadChatData = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const [meResponse, usersResponse, conversationsResponse] =
        await Promise.all([
          api.get("/users/me"),
          api.get("/users"),
          chatService.getConversations(),
        ]);

      const me = meResponse.data;
      const allUsers = usersResponse.data || [];
      const myConversations = conversationsResponse || [];

      setCurrentUser(me);
      setUsers(allUsers);
      setConversations(myConversations);

      const firstOtherUser = allUsers.find(
        (user) => user.id !== me.id
      );

      if (firstOtherUser) {
        setSelectedUser(firstOtherUser);

        const existingConversation = myConversations.find(
          (conversation) =>
            conversation.user_one_id === firstOtherUser.id ||
            conversation.user_two_id === firstOtherUser.id
        );

        if (existingConversation) {
          setSelectedConversation(existingConversation);
        }
      }
    } catch (err) {
      console.error("Chat loading failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load chat data."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ==========================================================
     GET OTHER USER FROM CONVERSATION
     ========================================================== */

  const getOtherUser = (conversation) => {
    if (!currentUser || !conversation) {
      return null;
    }

    const otherUserId =
      conversation.user_one_id === currentUser.id
        ? conversation.user_two_id
        : conversation.user_one_id;

    return users.find(
      (user) => user.id === otherUserId
    );
  };

  /* ==========================================================
     SELECT USER
     ========================================================== */

  const handleSelectUser = async (user) => {
    try {
      setSelectedUser(user);
      setError("");
      setMessages([]);

      let conversation = conversations.find(
        (item) =>
          currentUser &&
          (
            (
              item.user_one_id === currentUser.id &&
              item.user_two_id === user.id
            ) ||
            (
              item.user_two_id === currentUser.id &&
              item.user_one_id === user.id
            )
          )
      );

      if (!conversation) {
        conversation =
          await chatService.createConversation(
            user.id
          );

        setConversations((current) => {
          const alreadyExists = current.some(
            (item) => item.id === conversation.id
          );

          return alreadyExists
            ? current
            : [...current, conversation];
        });
      }

      setSelectedConversation(conversation);

      await loadMessages(conversation.id);

      connectWebSocket(conversation.id);
    } catch (err) {
      console.error(
        "Conversation loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to open conversation."
      );
    }
  };

  /* ==========================================================
     LOAD MESSAGES
     ========================================================== */

  const loadMessages = async (
    conversationId
  ) => {
    try {
      setLoadingMessages(true);

      const data =
        await chatService.getMessages(
          conversationId
        );

      setMessages(data || []);
    } catch (err) {
      console.error(
        "Message loading failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load messages."
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  /* ==========================================================
     WEBSOCKET
     ========================================================== */

  const connectWebSocket = (
    conversationId
  ) => {
    closeWebSocket();

    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    const protocol =
      window.location.protocol === "https:"
        ? "wss"
        : "ws";

    const host =
      "127.0.0.1:8000";

    const wsUrl =
      `${protocol}://${host}/ws/chat/${conversationId}?token=${encodeURIComponent(
        token
      )}`;

    const ws = new WebSocket(wsUrl);

    websocketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        if (
          data.type === "message"
        ) {
          setMessages((current) => {
            const alreadyExists =
              current.some(
                (item) =>
                  item.id === data.id
              );

            if (alreadyExists) {
              return current;
            }

            return [
              ...current,
              {
                id: data.id,
                conversation_id:
                  data.conversation_id,
                sender_id:
                  data.sender_id,
                message:
                  data.message,
                is_read:
                  data.is_read,
                is_edited:
                  data.is_edited,
                is_deleted:
                  data.is_deleted,
                created_at:
                  data.created_at,
                updated_at:
                  data.updated_at,
              },
            ];
          });

          setTimeout(
            scrollToBottom,
            50
          );
        }

        if (
          data.type === "error"
        ) {
          setError(
            data.message ||
              "Chat error."
          );
        }
      } catch (err) {
        console.error(
          "WebSocket message parse failed:",
          err
        );
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };
  };

  const closeWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setConnected(false);
  };

  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  const handleSendMessage = async (
    event
  ) => {
    event.preventDefault();

    const text =
      messageText.trim();

    if (
      !text ||
      !selectedConversation ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      if (
        websocketRef.current &&
        websocketRef.current.readyState ===
          WebSocket.OPEN
      ) {
        websocketRef.current.send(
          JSON.stringify({
            message: text,
          })
        );

        setMessageText("");
      } else {
        const newMessage =
          await chatService.sendMessage(
            selectedConversation.id,
            text
          );

        setMessages((current) => {
          const exists =
            current.some(
              (item) =>
                item.id ===
                newMessage.id
            );

          return exists
            ? current
            : [
                ...current,
                newMessage,
              ];
        });

        setMessageText("");
      }

      setTimeout(
        scrollToBottom,
        50
      );
    } catch (err) {
      console.error(
        "Message sending failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  /* ==========================================================
     SCROLL
     ========================================================== */

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ==========================================================
     FORMAT TIME
     ========================================================== */

  const formatTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatLastSeen = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  /* ==========================================================
     FILTER USERS
     ========================================================== */

  const filteredUsers = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return users
      .filter(
        (user) =>
          currentUser &&
          user.id !== currentUser.id
      )
      .filter((user) => {
        if (!keyword) {
          return true;
        }

        return (
          user.name
            ?.toLowerCase()
            .includes(keyword) ||
          user.email
            ?.toLowerCase()
            .includes(keyword)
        );
      });
  }, [
    users,
    currentUser,
    search,
  ]);

  /* ==========================================================
     CURRENT OTHER USER
     ========================================================== */

  const activeUser =
    selectedUser ||
    getOtherUser(
      selectedConversation
    );

  /* ==========================================================
     LOADING STATE
     ========================================================== */

  if (loadingUsers) {
    return (
      <>
        <style>
          {chatStyles}
        </style>

        <div className="chat-page">
          <div className="chat-loading">
            <div className="chat-spinner"></div>

            <h2>
              Loading Chat...
            </h2>

            <p>
              Loading your workforce conversations.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {chatStyles}
      </style>

      <div className="chat-page">

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="chat-page-header">

          <div>
            <div className="chat-eyebrow">
              WORKFORCE COMMUNICATION
            </div>

            <h1>
              Chat
            </h1>

            <p>
              Communicate directly with
              employees and workforce members.
            </p>
          </div>

          <div className="chat-status-summary">
            <span
              className={
                connected
                  ? "chat-online-dot online"
                  : "chat-online-dot"
              }
            ></span>

            {connected
              ? "Connected"
              : "Offline"}
          </div>

        </div>

        {/* ==================================================
            ERROR
            ================================================== */}

        {error && (
          <div className="chat-error">
            {error}

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* ==================================================
            MAIN CHAT
            ================================================== */}

        <div className="chat-container">

          {/* =================================================
              LEFT SIDEBAR
              ================================================= */}

          <aside className="chat-sidebar">

            <div className="chat-sidebar-header">

              <div>
                <h2>
                  Conversations
                </h2>

                <span>
                  {filteredUsers.length} people
                </span>
              </div>

            </div>

            <div className="chat-search">

              <span>
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search employees..."
              />

            </div>

            <div className="chat-user-list">

              {filteredUsers.length ===
              0 ? (
                <div className="chat-no-users">
                  No employees found.
                </div>
              ) : (
                filteredUsers.map(
                  (user) => {
                    const isSelected =
                      selectedUser?.id ===
                      user.id;

                    const userConversation =
                      conversations.find(
                        (conversation) =>
                          currentUser &&
                          (
                            (
                              conversation.user_one_id ===
                              currentUser.id &&
                              conversation.user_two_id ===
                              user.id
                            ) ||
                            (
                              conversation.user_two_id ===
                              currentUser.id &&
                              conversation.user_one_id ===
                              user.id
                            )
                          )
                      );

                    return (
                      <button
                        type="button"
                        key={user.id}
                        className={
                          isSelected
                            ? "chat-user selected"
                            : "chat-user"
                        }
                        onClick={() =>
                          handleSelectUser(
                            user
                          )
                        }
                      >

                        <div className="chat-avatar">
                          {(
                            user.name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="chat-user-info">

                          <div className="chat-user-top">

                            <strong>
                              {user.name}
                            </strong>

                            <span
                              className={
                                user.is_active
                                  ? "chat-active-label"
                                  : "chat-inactive-label"
                              }
                            >
                              {user.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                          </div>

                          <span className="chat-user-email">
                            {user.email}
                          </span>

                          <span className="chat-user-date">
                            {userConversation
                              ? `Conversation #${userConversation.id}`
                              : "Start conversation"}
                          </span>

                        </div>

                      </button>
                    );
                  }
                )
              )}

            </div>

          </aside>

          {/* =================================================
              CHAT PANEL
              ================================================= */}

          <main className="chat-main">

            {!activeUser ? (
              <div className="chat-empty-state">

                <div className="chat-empty-icon">
                  💬
                </div>

                <h2>
                  Start a conversation
                </h2>

                <p>
                  Select an employee from the
                  left to begin chatting.
                </p>

              </div>
            ) : (
              <>
                {/* ==========================================
                    CHAT HEADER
                    ========================================== */}

                <div className="chat-main-header">

                  <div className="chat-main-user">

                    <div className="chat-avatar large">
                      {activeUser.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2>
                        {activeUser.name}
                      </h2>

                      <span>
                        {connected
                          ? "● Online"
                          : "○ Connecting..."}
                      </span>
                    </div>

                  </div>

                  <div className="chat-main-meta">
                    <span>
                      {activeUser.email}
                    </span>
                  </div>

                </div>

                {/* ==========================================
                    MESSAGES
                    ========================================== */}

                <div className="chat-messages">

                  {loadingMessages ? (
                    <div className="chat-messages-loading">
                      Loading messages...
                    </div>
                  ) : messages.length ===
                    0 ? (
                    <div className="chat-empty-messages">

                      <div>
                        💬
                      </div>

                      <h3>
                        No messages yet
                      </h3>

                      <p>
                        Send the first message
                        to start this conversation.
                      </p>

                    </div>
                  ) : (
                    messages.map(
                      (message) => {
                        const isMine =
                          currentUser &&
                          message.sender_id ===
                            currentUser.id;

                        return (
                          <div
                            key={message.id}
                            className={
                              isMine
                                ? "message-row mine"
                                : "message-row"
                            }
                          >

                            <div
                              className={
                                isMine
                                  ? "message-bubble mine"
                                  : "message-bubble"
                              }
                            >

                              {message.is_deleted ? (
                                <em>
                                  Message deleted
                                </em>
                              ) : (
                                <span>
                                  {message.message}
                                </span>
                              )}

                              <div className="message-meta">

                                <span>
                                  {formatTime(
                                    message.created_at
                                  )}
                                </span>

                                {message.is_edited && (
                                  <span>
                                    edited
                                  </span>
                                )}

                                {isMine && (
                                  <span
                                    className={
                                      message.is_read
                                        ? "read-check"
                                        : ""
                                    }
                                  >
                                    {message.is_read
                                      ? "✓✓"
                                      : "✓"}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )
                  )}

                  <div
                    ref={
                      messagesEndRef
                    }
                  />

                </div>

                {/* ==========================================
                    COMPOSER
                    ========================================== */}

                <form
                  className="chat-composer"
                  onSubmit={
                    handleSendMessage
                  }
                >

                  <input
                    type="text"
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    placeholder="Type a message..."
                    maxLength={5000}
                    disabled={
                      !selectedConversation ||
                      sending
                    }
                  />

                  <span className="chat-character-count">
                    {messageText.length}/5000
                  </span>

                  <button
                    type="submit"
                    disabled={
                      !messageText.trim() ||
                      sending ||
                      !selectedConversation
                    }
                  >
                    {sending
                      ? "..."
                      : "➤"}
                  </button>

                </form>
              </>
            )}

          </main>

        </div>

      </div>
    </>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const chatStyles = `
  html,
  body,
  #root {
    background: #09111f !important;
    color: #ffffff !important;
  }

  .app-shell,
  .main-area,
  .page-content {
    background: #09111f !important;
    color: #ffffff !important;
  }

  .chat-page {
    width: 100%;
    min-height: calc(100vh - 70px);
    padding: 30px;
    box-sizing: border-box;
    background: #09111f !important;
    color: #ffffff !important;
  }

  .chat-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 22px;
  }

  .chat-eyebrow {
    color: #60a5fa;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    margin-bottom: 7px;
  }

  .chat-page-header h1 {
    margin: 0;
    color: #ffffff !important;
    font-size: 30px;
    font-weight: 800;
  }

  .chat-page-header p {
    margin: 8px 0 0;
    color: #94a3b8 !important;
    font-size: 14px;
  }

  .chat-status-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid #263850;
    border-radius: 10px;
    background: #111c2d !important;
    color: #cbd5e1 !important;
    font-size: 11px;
    font-weight: 700;
  }

  .chat-online-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #64748b;
  }

  .chat-online-dot.online {
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
  }

  .chat-error {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 12px 15px;
    border: 1px solid #7f1d1d;
    border-radius: 10px;
    background: #450a0a !important;
    color: #fecaca !important;
    font-size: 12px;
  }

  .chat-error button {
    border: 0;
    background: transparent;
    color: #fecaca;
    cursor: pointer;
    font-size: 18px;
  }

  .chat-container {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    min-height: 670px;
    overflow: hidden;
    border: 1px solid #263850;
    border-radius: 17px;
    background: #111c2d !important;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
  }

  .chat-sidebar {
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-right: 1px solid #263850;
    background: #0d1624 !important;
  }

  .chat-sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #263850;
  }

  .chat-sidebar-header h2 {
    margin: 0;
    color: #ffffff !important;
    font-size: 17px;
  }

  .chat-sidebar-header span {
    display: block;
    margin-top: 5px;
    color: #64748b !important;
    font-size: 11px;
  }

  .chat-search {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 14px;
    padding: 10px 12px;
    border: 1px solid #293b55;
    border-radius: 10px;
    background: #111c2d !important;
  }

  .chat-search span {
    font-size: 12px;
  }

  .chat-search input {
    width: 100%;
    border: 0;
    outline: none;
    background: transparent !important;
    color: #ffffff !important;
    font-size: 12px;
  }

  .chat-search input::placeholder {
    color: #64748b;
  }

  .chat-user-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 10px;
  }

  .chat-user {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 12px;
    margin-bottom: 5px;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent !important;
    color: #ffffff !important;
    text-align: left;
    cursor: pointer;
  }

  .chat-user:hover {
    background: #162033 !important;
  }

  .chat-user.selected {
    background: #172b4d !important;
    border-color: #2d4f86;
  }

  .chat-avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #1d4ed8;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
  }

  .chat-avatar.large {
    width: 46px;
    height: 46px;
  }

  .chat-user-info {
    min-width: 0;
    flex: 1;
  }

  .chat-user-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .chat-user-top strong {
    overflow: hidden;
    color: #ffffff !important;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-active-label,
  .chat-inactive-label {
    flex-shrink: 0;
    font-size: 8px;
    font-weight: 700;
  }

  .chat-active-label {
    color: #6ee7b7 !important;
  }

  .chat-inactive-label {
    color: #fca5a5 !important;
  }

  .chat-user-email {
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: #94a3b8 !important;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-user-date {
    display: block;
    margin-top: 5px;
    color: #64748b !important;
    font-size: 8px;
  }

  .chat-no-users {
    padding: 30px 15px;
    text-align: center;
    color: #64748b !important;
    font-size: 12px;
  }

  .chat-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #09111f !important;
  }

  .chat-main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding: 17px 20px;
    border-bottom: 1px solid #263850;
    background: #111c2d !important;
  }

  .chat-main-user {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .chat-main-user h2 {
    margin: 0;
    color: #ffffff !important;
    font-size: 15px;
  }

  .chat-main-user span {
    display: block;
    margin-top: 4px;
    color: #10b981 !important;
    font-size: 10px;
  }

  .chat-main-meta {
    color: #64748b !important;
    font-size: 9px;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    background: #09111f !important;
  }

  .chat-messages-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: #64748b !important;
    font-size: 12px;
  }

  .chat-empty-messages,
  .chat-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    min-height: 300px;
    text-align: center;
    color: #64748b !important;
  }

  .chat-empty-messages > div,
  .chat-empty-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    background: #172554 !important;
    font-size: 22px;
  }

  .chat-empty-messages h3,
  .chat-empty-state h2 {
    margin: 14px 0 5px;
    color: #ffffff !important;
  }

  .chat-empty-messages p,
  .chat-empty-state p {
    margin: 0;
    color: #64748b !important;
    font-size: 11px;
  }

  .message-row {
    display: flex;
    margin-bottom: 11px;
    justify-content: flex-start;
  }

  .message-row.mine {
    justify-content: flex-end;
  }

  .message-bubble {
    max-width: 68%;
    padding: 11px 13px;
    border: 1px solid #293b55;
    border-radius: 14px 14px 14px 4px;
    background: #111c2d !important;
    color: #dbeafe !important;
  }

  .message-bubble.mine {
    border-color: #2563eb;
    border-radius: 14px 14px 4px 14px;
    background: #1d4ed8 !important;
    color: #ffffff !important;
  }

  .message-bubble span {
    line-height: 1.5;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .message-meta {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 7px;
    margin-top: 5px;
    color: #94a3b8 !important;
    font-size: 8px;
  }

  .message-bubble.mine .message-meta {
    color: #bfdbfe !important;
  }

  .read-check {
    color: #86efac !important;
    font-weight: 800;
  }

  .chat-composer {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 14px 17px;
    border-top: 1px solid #263850;
    background: #111c2d !important;
  }

  .chat-composer input {
    flex: 1;
    min-width: 0;
    padding: 12px 65px 12px 13px;
    border: 1px solid #334155;
    border-radius: 10px;
    outline: none;
    background: #09111f !important;
    color: #ffffff !important;
    font-size: 12px;
  }

  .chat-composer input:focus {
    border-color: #3b82f6;
  }

  .chat-composer input::placeholder {
    color: #64748b;
  }

  .chat-character-count {
    position: absolute;
    right: 65px;
    color: #475569 !important;
    font-size: 8px;
  }

  .chat-composer button {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border: 0;
    border-radius: 10px;
    background: #2563eb !important;
    color: #ffffff !important;
    cursor: pointer;
    font-size: 16px;
    font-weight: 800;
  }

  .chat-composer button:hover:not(:disabled) {
    background: #1d4ed8 !important;
  }

  .chat-composer button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .chat-loading {
    min-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .chat-loading h2 {
    margin: 17px 0 6px;
    color: #ffffff !important;
  }

  .chat-loading p {
    margin: 0;
    color: #64748b !important;
    font-size: 12px;
  }

  .chat-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: chatSpin 0.8s linear infinite;
  }

  @keyframes chatSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 900px) {
    .chat-container {
      grid-template-columns: 250px minmax(0, 1fr);
    }

    .message-bubble {
      max-width: 78%;
    }
  }

  @media (max-width: 700px) {
    .chat-page {
      padding: 16px;
    }

    .chat-page-header {
      flex-direction: column;
    }

    .chat-container {
      grid-template-columns: 1fr;
      min-height: 700px;
    }

    .chat-sidebar {
      max-height: 280px;
      border-right: 0;
      border-bottom: 1px solid #263850;
    }

    .chat-user-list {
      max-height: 180px;
    }

    .chat-main {
      min-height: 450px;
    }

    .chat-main-meta {
      display: none;
    }
  }
`;