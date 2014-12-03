Chat = (function (window)
{
   var doc = document;
   var theHost = location.host;
   var contextPath = location.pathname.slice(0, location.pathname.lastIndexOf("/"));
   var connected = false;
   var loggedIn = false;
   var socket = null;
   var keepAliveTimer = null;
   var state = {0: "CONNECTING", 1: "OPEN", 2: "CLOSING", 3: "CLOSED"};

   var loginInput = null;
   var accountBtn = null;
   var sendBtn = null;
   var usernameInput = null;
   var passwordInput = null;
   var chatOutput = null;
   var chatMsgList = null;
   var chatInput = null;
   var infoOutput = null;

   function init()
   {
      loginInput = doc.getElementById("loginInput");
      accountBtn = doc.getElementById("accountBtn");
      sendBtn = doc.getElementById("sendBtn");
      usernameInput = doc.getElementById("usernameInput");
      passwordInput = doc.getElementById("passwordInput");
      chatOutput = doc.getElementById("chatOutput");
      chatInput = doc.getElementById("chatInput");
      infoOutput = doc.getElementById("infoOutput");

      accountBtn.onclick = accountHandler;
      sendBtn.onclick = sendMsgHandler;
      chatInput.onkeypress = sendMsgHandler;
   }


   function connect(url)
   {
      if (connected) {
         disconnect(true);
         return;
      }

      try {
         socket = new WebSocket(url);
         socket.onopen = onOpen;
         socket.onmessage = onMessage;
         socket.onerror = onError;
         socket.onclose = onClose;
         console.log("WS: " + state[socket.readyState]);
      } catch (e) {
         console.error(e.toString());
      }
   }

   function disconnect(active)
   {
      connected = false;
      loggedIn = false;
      accountBtn.value = "Login";
      loginInput.style.display = "";
      passwordInput.value = "";

      clearInterval(keepAliveTimer);

      if (active) {
         socket.close(1000);
      }

      socket = null;
   }

   function sendLogin()
   {
      var wsMsg = {};
      var loginMsg = {};
      wsMsg.TYPE = "ACCOUNT";
      wsMsg.SUBTYPE = "LOGIN";
      loginMsg.USER = usernameInput.value;
      loginMsg.PASSWD = passwordInput.value;
      wsMsg.LOGIN_MSG = loginMsg;
      socket.send(JSON.stringify(wsMsg));
   }

   function sendLogout()
   {
      var wsMsg = {};
      wsMsg.TYPE = "ACCOUNT";
      wsMsg.SUBTYPE = "LOGOUT";
      socket.send(JSON.stringify(wsMsg));
   }

   function accountHandler()
   {
      if (!connected) {
         loggedIn = false;
         connect("ws://" + theHost + contextPath + "/ws");
      } else {
         if (loggedIn) {
            sendLogout();
         }
      }
   }

   function sendMsgHandler(evt)
   {
      if (!connected || !loggedIn) {
         return;
      }

      if (evt.type == "keypress" && evt.keyCode != 13) {
         return;
      }

      var wsMsg = {};
      var chatMsg = {};

      wsMsg.TYPE = "CHAT";
      wsMsg.SUBTYPE = "MSG";
      chatMsg.MSG = chatInput.value.trim();
      wsMsg.CHAT_MSG = chatMsg;
      chatInput.value = "";

      if (chatMsg.MSG.length > 0) {
         socket.send(JSON.stringify(wsMsg));
      }
   }

   function onOpen(msg)
   {
      console.log("WS: " + state[this.readyState]);
      connected = true;
      sendLogin();
   }

   function onMessage(message)
   {
      try {
         console.log("WS: " + message.data);
         var wsMsg = JSON.parse(message.data.trim());
         parseMsg(wsMsg);
      } catch (err) {
         console.log("WS: " + err.toString());
      }
   }

   function onClose(msg)
   {
      console.error("WS: onClose()");
      console.log("WS: Disconnected clean: " + msg.wasClean);
      console.log("WS: Code: " + msg.code);
      console.log("WS: " + state[this.readyState]);
      disconnect(false);
   }


   function onError(msg)
   {
      console.error("WS: onError()");
      console.log("WS: Disconnected clean: " + msg.wasClean);
      console.log("WS: Code: " + msg.code);
      console.log("WS: " + state[this.readyState]);
      disconnect(false);
   }

   function parseMsg(msg)
   {
      if (msg.TYPE == "ACCOUNT") {

         if (msg.SUBTYPE == "LOGIN" && msg.RESULT_MSG.CODE == "OK") {
            loggedIn = true;
            accountBtn.value = "Logout";
            loginInput.style.display = "none";

            keepAliveTimer = setInterval(function ()
            {
               var wsMsg = {};
               wsMsg.TYPE = "PING";
               socket.send(JSON.stringify(wsMsg));
            }, 49 * 1000);
         }

         infoOutput.style.color = (msg.RESULT_MSG.CODE == "OK") ? "#0f0" : "#f00";
         infoOutput.textContent = msg.RESULT_MSG.MSG;
         console.log("Account result msg: " + msg.RESULT_MSG.MSG);
      }

      if (msg.TYPE == "CHAT") {
         var newMsgElem = doc.createElement("DIV");
         newMsgElem.className = "ChatMsg";
         newMsgElem.style.color = msg.CHAT_MSG.COLOR;
         newMsgElem.innerHTML = "</div><div>" + msg.CHAT_MSG.FROM + " ></div><div>" + msg.CHAT_MSG.MSG + "</div>";
         chatOutput.appendChild(newMsgElem);
         chatOutput.scrollTop = chatOutput.scrollHeight;
      }
   }

   init();


})(this);
