import {httpClient} from "../config/AxiosHelper";

export const createRoomApi = async (roomDetail) =>{
  const respone = await httpClient.post(`/api/v1/rooms`, roomDetail, {
    header: {
      "Content-Type": "text/plain",
    }
  });
  return respone.data;
}

export const joinChatApi = async (roomId) =>{
  const response = await httpClient.get(`/api/v1/rooms/${roomId}`);
  return response.data;
}

export const getMessages = async (roomId, size = 50, page = 0) => {
  const response = await httpClient.get(
    `/api/v1/rooms/${roomId}/message?size=${size}&page=${page}`
  );
  return response.data;
};