package persistence.hibernate;

import org.hibernate.SessionFactory;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.Configuration;



public class HibernateUtil
{

    private static SessionFactory sessionFactory;

    static {

        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.err.println("Foo");
            e.printStackTrace();
        }

        Configuration configuration = new Configuration().configure("/META-INF/hibernate.cfg.xml");
        StandardServiceRegistryBuilder builder = new StandardServiceRegistryBuilder().applySettings(configuration.getProperties());
        sessionFactory = configuration.buildSessionFactory(builder.build());
    }


    public static SessionFactory getSessionFactory()
    {
        return sessionFactory;
    }

}