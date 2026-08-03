import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { fetchSessionsById, deleteSessionApi, updateSessionTitleApi, toggleSaveSessionApi } from './sessionApi';


export const fetchAllSessions = createAsyncThunk('session/allSessions', async ({ userId, searchText }: { userId: string; searchText: string }) => {
    const res = await fetchSessionsById(userId, searchText)
    return res.result
})

export const deleteSessionThunk = createAsyncThunk('session/deleteSession', async (sessionId: string) => {
    await deleteSessionApi(sessionId)
    return sessionId
})

export const updateSessionTitleThunk = createAsyncThunk('session/updateSessionTitle', async ({ sessionId, title }: { sessionId: string, title: string }) => {
    await updateSessionTitleApi(sessionId, title)
    return { sessionId, title }
})

export const toggleSaveSessionThunk = createAsyncThunk('session/toggleSaveSession', async (sessionId: string) => {
    await toggleSaveSessionApi(sessionId)
    return sessionId
})

export type sessionProps = {
    sessionId: string,
    userId: string,
    title: string,
    createdAt: string,
    lastMessage: string,
    isSaved: boolean
}

interface sessionState {
    sessions: sessionProps[]
    error: string | null
    loading: boolean
}
const initialState: sessionState = {
    sessions: [],
    error: null,
    loading: false
}

export const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        addNewSessions: (state, action: PayloadAction<sessionProps>) => {
            const alreadyExists = state.sessions.some(
                session => session.sessionId === action.payload.sessionId
            )

            if (!alreadyExists) {
                state.sessions.unshift(action.payload)
            }
        },
        updateLastMessage: (state, action) => {
            const { sessionId, lastMessage } = action.payload
            const session = state.sessions.find(s => s.sessionId === sessionId)
            if (session) {
                session.lastMessage = lastMessage
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllSessions.fulfilled, (state, action) => {
                state.loading = false
                state.sessions = action.payload
                state.error = null
            })
            .addCase(fetchAllSessions.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchAllSessions.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string || "Something went wrong"
            })
            .addCase(deleteSessionThunk.fulfilled, (state, action) => {
                state.sessions = state.sessions.filter(s => s.sessionId !== action.payload)
            })
            .addCase(updateSessionTitleThunk.fulfilled, (state, action) => {
                const session = state.sessions.find(s => s.sessionId === action.payload.sessionId)
                if (session) {
                    session.title = action.payload.title
                }
            })
            .addCase(toggleSaveSessionThunk.fulfilled, (state, action) => {
                const session = state.sessions.find(s => s.sessionId === action.payload)
                if (session) {
                    session.isSaved = !session.isSaved
                }
            })
    }

})

export const { addNewSessions, updateLastMessage } = sessionSlice.actions
export default sessionSlice.reducer


