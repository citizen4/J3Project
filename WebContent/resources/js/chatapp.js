Chat = (function (window)
{
   var $ = function (e)
   {
      return document.getElementById(e);
   };
   var doc = document;
   var theHost = location.host;
   var contextPath = location.pathname.slice(0, location.pathname.lastIndexOf("/"));
   var connected = false;
   var loggedIn = false;
   var socket = null;
   var keepAliveTimer = null;
   var state = {0: "CONNECTING", 1: "OPEN", 2: "CLOSING", 3: "CLOSED"};

   function init()
   {
      $("accountBtn").onclick = accountHandler;
      $("sendBtn").onclick = sendMsgHandler;
      $("chatInput").onkeypress = sendMsgHandler;
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
      $("accountBtn").value = "Login";
      $("loginInput").style.display = "";
      $("loginGreeting").style.display = "none";
      $("passwordInput").value = "";

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
      loginMsg.USER = $("usernameInput").value;
      loginMsg.PASSWD = $("passwordInput").value;
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
      chatMsg.MSG = $("chatInput").value.trim();
      wsMsg.CHAT_MSG = chatMsg;
      $("chatInput").value = "";

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
            $("accountBtn").value = "Logout";
            $("loginInput").style.display = "none";
            $("loginGreeting").textContent = "Hi " + msg.LOGIN_MSG.USER + "! ";
            $("loginGreeting").style.display = "";

            keepAliveTimer = setInterval(function ()
            {
               var wsMsg = {};
               wsMsg.TYPE = "PING";
               socket.send(JSON.stringify(wsMsg));
            }, 49 * 1000);
         }

         showLoginInfo(msg.RESULT_MSG.MSG, (msg.RESULT_MSG.CODE == "OK") ? "#0f0" : "#f00");
         showInfo(msg.RESULT_MSG.MSG, (msg.RESULT_MSG.CODE == "OK") ? "#0f0" : "#f00");

         console.log("Account result msg: " + msg.RESULT_MSG.MSG);
      }

      if (msg.TYPE == "CHAT") {
         var newMsgElem = doc.createElement("DIV");
         newMsgElem.className = "ChatMsg";
         newMsgElem.style.color = msg.CHAT_MSG.COLOR;
         newMsgElem.innerHTML = "<div>" + msg.CHAT_MSG.FROM + " ></div><div>" + msg.CHAT_MSG.MSG + "</div>";
         $("chatOutput").appendChild(newMsgElem);
         $("chatOutput").scrollTop = $("chatOutput").scrollHeight;
      }
   }

   function showInfo(infoMsg, color)
   {
      $("infoOutput").textContent = infoMsg;
      $("infoOutput").style.color = color;
      $("infoOutput").style.top = "0";
      setTimeout(function ()
      {
         $("infoOutput").style.top = "30px";
      }, 4000);
   }

   function showLoginInfo(infoMsg, color)
   {
      $("loginInfoOutput").textContent = infoMsg;
      $("loginInfoOutput").style.color = color;
      $("loginInfoOutput").style.top = "0";
      setTimeout(function ()
      {
         $("loginInfoOutput").style.top = "-35px";
      }, 3000);
   }


   init();


})(this);
