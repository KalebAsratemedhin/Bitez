"""RabbitMQ messaging utilities."""

import json
import logging
from typing import Optional, Callable, Dict, Any
import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import BasicProperties

from shared.logging import get_logger
from shared.exceptions import MessagingError

logger = get_logger("messaging")


class RabbitMQConnection:
    """RabbitMQ connection manager."""
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 5672,
        username: str = "guest",
        password: str = "guest",
        virtual_host: str = "/"
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.virtual_host = virtual_host
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[BlockingChannel] = None
        
        logger.info("RabbitMQ connection initialized", extra={
            "host": host,
            "port": port,
            "virtual_host": virtual_host
        })
    
    def connect(self):
        try:
            credentials = pika.PlainCredentials(self.username, self.password)
            parameters = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                virtual_host=self.virtual_host,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            logger.info("Connected to RabbitMQ")
        except Exception as e:
            logger.error("Failed to connect to RabbitMQ", extra={"error": str(e)})
            raise MessagingError(f"Failed to connect to RabbitMQ: {str(e)}")
    
    def disconnect(self):
        try:
            if self.channel and not self.channel.is_closed:
                self.channel.close()
            if self.connection and not self.connection.is_closed:
                self.connection.close()
            logger.info("Disconnected from RabbitMQ")
        except Exception as e:
            logger.error("Error disconnecting from RabbitMQ", extra={"error": str(e)})
    
    def ensure_connection(self):
        if not self.connection or self.connection.is_closed:
            self.connect()
        if not self.channel or self.channel.is_closed:
            self.channel = self.connection.channel()
    
    def declare_exchange(
        self,
        exchange_name: str,
        exchange_type: str = "topic",
        durable: bool = True
    ):
       
        self.ensure_connection()
        self.channel.exchange_declare(
            exchange=exchange_name,
            exchange_type=exchange_type,
            durable=durable
        )
        logger.debug(f"Exchange declared: {exchange_name}")
    
    def declare_queue(
        self,
        queue_name: str,
        durable: bool = True,
        exclusive: bool = False,
        auto_delete: bool = False
    ):
        
        self.ensure_connection()
        self.channel.queue_declare(
            queue=queue_name,
            durable=durable,
            exclusive=exclusive,
            auto_delete=auto_delete
        )
        logger.debug(f"Queue declared: {queue_name}")
    
    def bind_queue(
        self,
        queue_name: str,
        exchange_name: str,
        routing_key: str = ""
    ):
        
        self.ensure_connection()
        self.channel.queue_bind(
            queue=queue_name,
            exchange=exchange_name,
            routing_key=routing_key
        )
        logger.debug(f"Queue {queue_name} bound to exchange {exchange_name} with key {routing_key}")


class MessagePublisher:
    
    def __init__(self, connection: RabbitMQConnection):
        self.connection = connection
    
    def publish(
        self,
        exchange_name: str,
        routing_key: str,
        message: Dict[str, Any],
        properties: Optional[BasicProperties] = None
    ):
       
        try:
            self.connection.ensure_connection()
            # Ensure exchange exists
            self.connection.declare_exchange(exchange_name)
            
            # Publish message
            self.connection.channel.basic_publish(
                exchange=exchange_name,
                routing_key=routing_key,
                body=json.dumps(message),
                properties=properties or pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type="application/json"
                )
            )
            
            logger.debug("Message published", extra={
                "exchange": exchange_name,
                "routing_key": routing_key
            })
        except Exception as e:
            logger.error("Failed to publish message", extra={
                "error": str(e),
                "exchange": exchange_name,
                "routing_key": routing_key
            })
            raise MessagingError(f"Failed to publish message: {str(e)}")


class MessageConsumer:
    def __init__(self, connection: RabbitMQConnection):
        self.connection = connection
    
    def consume(
        self,
        queue_name: str,
        callback: Callable[[Dict[str, Any], Any], None],
        auto_ack: bool = False
    ):
      
        try:
            self.connection.ensure_connection()
            self.connection.declare_queue(queue_name)
            
            def on_message(channel, method, properties, body):
                try:
                    message = json.loads(body)
                    callback(message, channel)
                    if not auto_ack:
                        channel.basic_ack(delivery_tag=method.delivery_tag)
                except json.JSONDecodeError as e:
                    logger.error("Failed to decode message", extra={"error": str(e)})
                    if not auto_ack:
                        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                except Exception as e:
                    logger.error("Error processing message", extra={"error": str(e)})
                    if not auto_ack:
                        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            
            self.connection.channel.basic_consume(
                queue=queue_name,
                on_message_callback=on_message,
                auto_ack=auto_ack
            )
            
            logger.info(f"Started consuming from queue: {queue_name}")
            self.connection.channel.start_consuming()
        except Exception as e:
            logger.error("Failed to consume messages", extra={"error": str(e)})
            raise MessagingError(f"Failed to consume messages: {str(e)}")


# Global connection instance (to be initialized by each service)
_rmq_instance: Optional[RabbitMQConnection] = None


def init_rabbitmq(
    host: str = "localhost",
    port: int = 5672,
    username: str = "guest",
    password: str = "guest",
    virtual_host: str = "/"
) -> RabbitMQConnection:
    global _rmq_instance
    _rmq_instance = RabbitMQConnection(host, port, username, password, virtual_host)
    _rmq_instance.connect()
    return _rmq_instance


def get_rabbitmq() -> RabbitMQConnection:
    if _rmq_instance is None:
        raise MessagingError("RabbitMQ has not been initialized. Call init_rabbitmq() first.")
    return _rmq_instance