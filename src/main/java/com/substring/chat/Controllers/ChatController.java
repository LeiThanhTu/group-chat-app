package com.substring.chat.Controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.payload.MessageRequest;
import com.substring.chat.repositories.RoomRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@CrossOrigin("http://localhost:5173")
public class ChatController {

    private RoomRepository roomRepository;

    public ChatController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    // for sending and receiving messages

    @RequestMapping("/sendMessage/{roomId}")   // /app/sendMessage/roomId
    @SendTo("/topic/room/{roomId}") //subscribe
    public Message sendMessage(
            @DestinationVariable String roomId,
            @RequestBody MessageRequest request
    ){
            Room room = roomRepository.findByRoomId(roomId);
            Message message = new Message();
            message.setSender(request.getSender());
            message.setContent(request.getContent());
            message.setTimeStamp(LocalDateTime.now());
            if (room == null) {
                room.getMessages().add(message);
                roomRepository.save(room);
            }else{
                throw new RuntimeException("Room not found!");
            }
            return message;
    }

}
