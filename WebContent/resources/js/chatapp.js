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
   var usernameInput = null;
   var passwordInput = null;
   var chatOutput = null;
   var infoOutput = null;

   function init()
   {
      loginInput = doc.getElementById("loginInput");
      accountBtn = doc.getElementById("accountBtn");
      usernameInput = doc.getElementById("usernameInput");
      passwordInput = doc.getElementById("passwordInput");
      chatOutput = doc.getElementById("chatOutput");
      infoOutput = doc.getElementById("infoOutput");
      accountBtn.onclick = account;
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
      //usernameInput.style.display = "";
      //passwordInput.style.display = "";

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

   function account()
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
            //usernameInput.style.display = "none";
            //passwordInput.style.display = "none";
            loginInput.style.display = "none";

            keepAliveTimer = setInterval(function ()
            {
               var wsMsg = {};
               wsMsg.TYPE = "PING";
               socket.send(JSON.stringify(wsMsg));
            }, 49 * 1000);
         }
         /*else{
          loggedIn = false;
          accountBtn.value = "Login";
          }*/

         infoOutput.style.color = (msg.RESULT_MSG.CODE == "OK") ? "#0f0" : "#f00";
         infoOutput.textContent = msg.RESULT_MSG.MSG;
         console.log("Account result msg: " + msg.RESULT_MSG.MSG);
      }
   }

   init();


})(this);
