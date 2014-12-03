package ws;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import model.User;
import org.pmw.tinylog.Logger;
import persistence.dao.HibernateImpl;
import persistence.dao.IUserDao;
import util.PasswordStore;
import ws.protocol.Message;
import ws.protocol.ResultMsg;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;

@ServerEndpoint("/ws")
public class WsServer
{
   private static final int IDLE_TIMEOUT_SEC = 60;
   private final IUserDao userDao = new HibernateImpl();
   private Session thisSession = null;

   @OnOpen
   public void onOpen(Session session)
   {
      Logger.debug("onOpen(): " + session.getId());
      thisSession = session;
      thisSession.setMaxIdleTimeout(IDLE_TIMEOUT_SEC * 1000);
      thisSession.getUserProperties().clear();
   }

   @OnMessage
   public void onTextMsg(String jsonStr)
   {
      Gson gson = new GsonBuilder().serializeNulls().create();//new Gson();

      try {
         jsonStr = jsonStr.trim();
         Logger.debug("Recv.:" + jsonStr + " from: " + thisSession.getId());
         Message clientMsg = gson.fromJson(jsonStr, Message.class);

         if (clientMsg.TYPE.equals("ACCOUNT")) {
            handleAccount(clientMsg);
         }

         validateUserSession();

         if (clientMsg.TYPE.equals("PING")) {
            Logger.debug("Ping from: " + thisSession.getId());
            sendPong();
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
    }

   @OnMessage
   public void onPingMsg(PongMessage msg)
   {
      Logger.debug("Pong from: " + thisSession.getId());
      if (validateUserSession()) {
         try {
            thisSession.getBasicRemote().sendPong(msg.getApplicationData());
         } catch (IOException e) {
            Logger.error(e);
         }
      }
   }*/

   @OnClose
   public void onClose()
   {
      Logger.debug("onClose(): " + thisSession.getId());
      if (thisSession.getUserProperties().containsKey("USER")) {
         thisSession.getUserProperties().clear();
      }
   }


   private void sendPong()
   {
      Message pongMsg = new Message();
      pongMsg.TYPE = "PONG";
      sendMessage(pongMsg);
   }

   private void handleAccount(final Message clientMsg)
   {
      Message serverMsg = new Message();
      serverMsg.TYPE = "ACCOUNT";

      if (clientMsg.SUBTYPE.equals("LOGIN")) {
         serverMsg.SUBTYPE = "LOGIN";
         serverMsg.RESULT_MSG = loginUser(clientMsg.LOGIN_MSG.USER, clientMsg.LOGIN_MSG.PASSWD);
      }

      if (clientMsg.SUBTYPE.equals("LOGOUT")) {
         serverMsg.SUBTYPE = "LOGOUT";
         serverMsg.RESULT_MSG = logoutUser();
      }

      sendMessage(serverMsg);
   }


   private void sendMessage(final Message serverMsg)
   {
      final Gson gson = new Gson();
      final String jsonStr = gson.toJson(serverMsg);

      try {
         if (thisSession.isOpen()) {
            Logger.debug("Send: " + jsonStr + " to: " + thisSession.getId());
            thisSession.getBasicRemote().sendText(jsonStr);
         }
      } catch (IOException e) {
         Logger.error(e);
      }
   }

   private void broadcastMessage(final Message serverMsg, final boolean includeThis)
   {


   }


   private ResultMsg loginUser(final String userName, final String password)
   {
      Logger.debug("LOGIN User: " + userName + " PW: " + password);
      User user;
      ResultMsg resultMsg = new ResultMsg();

      resultMsg.CODE = "ERR";

      for (Session s : thisSession.getOpenSessions()) {
         if (s.getUserProperties().containsKey("USER")) {
            String sessionUserName = (String) (s.getUserProperties().get("USER"));
            if (sessionUserName.equalsIgnoreCase(userName)) {
               resultMsg.MSG = "You are already logged in!";
               return resultMsg;
            }
         }
      }

      user = userDao.findByUserName(userName);

      if (user.getUsername() != null) {
         Logger.debug("User " + user.getUsername() + " does exist");
         if (PasswordStore.isPasswordCorrect(password, user.getPwHash())) {
            Logger.debug("Password OK");
            resultMsg.CODE = "OK";
            resultMsg.MSG = "Login successful!";
            thisSession.getUserProperties().put("USER", userName);
            return resultMsg;
         }
      }

      resultMsg.MSG = "Wrong username or password!";
      return resultMsg;
   }


   private ResultMsg logoutUser()
   {
      ResultMsg resultMsg = new ResultMsg();

      if (thisSession.getUserProperties().containsKey("USER")) {
         resultMsg.CODE = "OK";
         resultMsg.MSG = "You have successfully logged out!";
         thisSession.getUserProperties().clear();
      } else {
         resultMsg.CODE = "ERR";
         resultMsg.MSG = "You where not logged in!";
      }

      return resultMsg;
   }

   /**
    * @return returns true only if connection is open AND authorized
    */
   private boolean validateUserSession()
   {
      boolean result = false;

      // close connection to unauthorized peers
      if (thisSession.isOpen()) {
         if (!thisSession.getUserProperties().containsKey("USER")) {
            Logger.debug("Closing connection to unauthorized peer: " + thisSession.getId());
            activeClose(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, "Message from unauthorized peer"));
            result = false;
         } else {
            result = true;
         }
      }

      return result;
   }

   private void activeClose(CloseReason reason)
   {
      try {
         if (thisSession.isOpen()) {
            Logger.debug("Closing connection to peer: " + thisSession.getId());
            thisSession.close(reason);
         }
      } catch (IOException e) {
         Logger.error(e);
      }
   }

}
