import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchBySessionId } from './chatsApi'
import type { MessageProps } from '@/components/ChatBot'


export const fetchAllChats = createAsyncThunk('chat/allChats', async ({ sessionId }: { sessionId: string }) => {
    const res = await fetchBySessionId(sessionId)
    return res.result
})

type ChatsState = {
    messages: MessageProps[];
    loading: boolean;
    error: string | null;
}

const initialState: ChatsState = {
    messages: [],
    loading: false,
    error: null,
}

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        resetChats(state) {
            state.messages = []
            state.loading = false
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllChats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllChats.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload;

            })
            .addCase(fetchAllChats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? "Failed to fetch chats";
            })
    }

})
export const { resetChats } = chatSlice.actions
export default chatSlice.reducer
