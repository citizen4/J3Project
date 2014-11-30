package ws;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.PongMessage;
import javax.websocket.Session;
import java.io.IOException;
import java.nio.ByteBuffer;

public class WsServer
{

    @OnOpen
    public void onOpen(Session session)
    {
        session.setMaxIdleTimeout(60000);
        System.out.println(session.getId() + " has opened a connection");
        try {
            session.getBasicRemote().sendText("Connection Established");
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    @OnMessage
    public void textMessage(Session session, String msg)
    {
        System.out.println("Text message: " + msg);
    }

    @OnMessage
    public void binaryMessage(Session session, ByteBuffer msg)
    {
        System.out.println("Binary message: " + msg.toString());
    }

    @OnMessage
    public void pongMessage(Session session, PongMessage msg)
    {
        System.out.println("Pong message: " + msg.getApplicationData().toString());
    }

    @OnClose
    public void onClose(Session session)
    {
        System.out.println("Session " + session.getId() + " has ended");
    }
}
