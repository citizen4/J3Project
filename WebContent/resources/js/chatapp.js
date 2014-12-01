Chat = (function (window)
{
    var doc = document;
    var theHost = location.host;
    var contextPath = location.pathname.slice(0, location.pathname.lastIndexOf("/"));
    var connected = false;
    var socket = null;
    var state = {0: "CONNECTING", 1: "OPEN", 2: "CLOSING", 3: "CLOSED"};


    function init()
    {

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

        if (active) {
            socket.close(1000);
        }
        socket = null;
    }

    function sendLogin()
    {
        var loginMsg = {};
        loginMsg.TYPE = "LOGIN";
        loginMsg.USER = doc.getElementById("username").value;
        loginMsg.PASSWD = doc.getElementById("password").value;
        socket.send(JSON.stringify(loginMsg));
    }

    function login()
    {
        connect("ws://" + theHost + contextPath + "/ws");
    }

    function logout()
    {

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
            alert(message.data);
            console.log("WS: " + message.data);
            var wsMsg = JSON.parse(message.data.trim());
            parseMsg(wsMsg);
        } catch (err) {
            console.log("WS: " + err.toString());
            return;
        }
    }

    function onClose(msg)
    {
        connected = false;
        console.log("WS: Disconnected clean: " + msg.wasClean);
        console.log("WS: Code: " + msg.code);
        console.log("WS: " + state[this.readyState]);
        disconnect(false);
    }


    function onError(msg)
    {
        connected = false;
        console.log("WS: Disconnected clean: " + msg.wasClean);
        console.log("WS: Code: " + msg.code);
        console.log("WS: " + state[this.readyState]);
        disconnect(false);
    }

    function parseMsg(msg)
    {
        if (msg.TYPE == "LOGIN") {

        }

    }


    return {
        login: login,
        logout: logout
    }

})(this);
