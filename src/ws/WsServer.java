package ws;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.PongMessage;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.nio.ByteBuffer;

@ServerEndpoint("/ws")
public class WsServer
{
    private static final int IDLE_TIMEOUT_SEC = 60;

    @OnOpen
    public void onOpen(Session session)
    {
        session.setMaxIdleTimeout(IDLE_TIMEOUT_SEC * 1000);
        System.out.println(session.getId() + " has opened a connection");
        try {
            session.getBasicRemote().sendText("Connection Established");
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    @OnMessage
    public void onTextMsg(Session session, String msg)
    {
        System.out.println("Text message: " + msg);
        try {
            session.getBasicRemote().sendText("Connection Established");
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    /*
    @OnMessage
    public void binaryMessage(Session session, ByteBuffer msg)
    {
        System.out.println("Binary message: " + msg.toString());
    }*/

    @OnMessage
    public void onPongMsg(Session session, PongMessage msg)
    {
        System.out.println("Pong message: " + msg.getApplicationData().toString());
    }

    @OnClose
    public void onClose(Session session)
    {
        System.out.println("Session " + session.getId() + " has ended");
    }
}
