package ws;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import org.pmw.tinylog.Logger;
import ws.protocol.Message;

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
    }

    @OnMessage
    public void onTextMsg(Session session, String jsonStr)
    {
        Gson gson = new GsonBuilder().serializeNulls().create();//new Gson();

        try {
            jsonStr = jsonStr.trim();
            Logger.debug("Recv.:" + jsonStr + " from: " + session.getId());
            Message clientMsg = gson.fromJson(jsonStr, Message.class);

            if (clientMsg.TYPE.equals("ACCOUNT")) {
                handleAccount(session, clientMsg);
            }

        } catch (JsonSyntaxException e) {
            Logger.error(e);
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


    private void handleAccount(final Session session, final Message clientMsg)
    {
        if (clientMsg.SUBTYPE.equals("LOGIN")) {
            Logger.debug("LOGIN User: " + clientMsg.LOGIN_MSG.USER + " PW: " + clientMsg.LOGIN_MSG.PASSWD);
            Message serverMsg = new Message();
            serverMsg.TYPE = "ACCOUNT";
            serverMsg.SUBTYPE = "LOGIN";
            serverMsg.RESULT = "OK";
            sendMessage(session, serverMsg);
        }
    }


    private void sendMessage(final Session session, final Message serverMsg)
    {
        final Gson gson = new Gson();
        final String jsonStr = gson.toJson(serverMsg);
        Logger.debug("Send: " + jsonStr + " to: " + session.getId());

        try {
            session.getBasicRemote().sendText(jsonStr);
        } catch (IOException ex) {
            ex.printStackTrace();
        }

    }

}
