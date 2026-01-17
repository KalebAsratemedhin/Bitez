from contextlib import contextmanager
from typing import Generator, Optional
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool

from shared.logging import get_logger
from shared.exceptions import DatabaseError

logger = get_logger("database")

Base = declarative_base()

class Database:
    def __init__(
        self,
        database_url: str,
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_pre_ping: bool = True,
        echo: bool = False
    ):
        self.database_url = database_url
        self.engine = create_engine(
            database_url,
            pool_class=QueuePool,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=pool_pre_ping,
            echo=echo
        )

        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

        self._setup_event_listeners()

        logger.info("Database connection initialized", extra={
            "database_url": database_url.split("@")[-1] if "@" in database_url else "hidden"
        })
    
    def _setup_event_listeners(self):
        @event.listens_for(self.engine, "checkout")
        def receive_checkout(dbapi_conn, connection_record, connection_proxy):
            logger.debug("Connection checked out from pool")
        
        @event.listens_for(self.engine, "checkin")
        def receive_checkin(dbapi_conn, connection_record):
            logger.debug("Connection returned to pool")

    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error("Database session error", extra={"error": str(e)})
            raise DatabaseError(f"Database operation failed: {str(e)}")
        finally:
            session.close()
        
    def get_session_dependency(self) -> Session:
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error("Database session error", extra={"error": str(e)})
            raise DatabaseError(f"Database operation failed: {str(e)}")
        finally:
            session.close()
    
    def create_tables(self):
        Base.metadata.create_all(bind=self.engine)
        logger.info("Database tables created")
    
    def drop_tables(self):
        Base.metadata.drop_all(bind=self.engine)
        logger.info("Database tables dropped")
    
    def health_check(self) -> bool:
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error("Database health check failed", extra={"error": str(e)})
            return False

_db_instance: Optional[Database] = None


def init_database(database_url: str, **kwargs) -> Database:
    global _db_instance
    _db_instance = Database(database_url, **kwargs)
    return _db_instance


def get_database() -> Database:
    if _db_instance is None:
        raise DatabaseError("Database has not been initialized. Call init_database() first.")
    return _db_instance
