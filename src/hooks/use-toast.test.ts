import { describe, it, expect } from "vitest"

import { reducer } from "./use-toast"

describe("toast reducer", () => {
  it("adds a toast", () => {
    const toast = { id: "1", title: "Hello", open: true }
    const state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast } as any)
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0]).toMatchObject(toast)
  })

  it("updates a toast", () => {
    const toast = { id: "1", title: "Hello", open: true }
    let state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast } as any)
    state = reducer(state, { type: "UPDATE_TOAST", toast: { id: "1", title: "Updated" } } as any)
    expect(state.toasts[0].title).toBe("Updated")
  })

  it("dismisses a toast", () => {
    const toast = { id: "1", title: "Hello", open: true }
    let state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast } as any)
    state = reducer(state, { type: "DISMISS_TOAST", toastId: "1" })
    expect(state.toasts[0].open).toBe(false)
  })

  it("dismisses all toasts when no id provided", () => {
    const toast1 = { id: "1", title: "One", open: true }
    const toast2 = { id: "2", title: "Two", open: true }
    let state = { toasts: [toast1, toast2] } as any
    state = reducer(state, { type: "DISMISS_TOAST" } as any)
    expect(state.toasts).toHaveLength(2)
    expect(state.toasts.every((t: any) => t.open === false)).toBe(true)
  })

  it("removes a toast", () => {
    const toast = { id: "1", title: "Hello", open: true }
    let state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast } as any)
    state = reducer(state, { type: "REMOVE_TOAST", toastId: "1" })
    expect(state.toasts).toHaveLength(0)
  })

  it("removes all toasts when no id provided", () => {
    const toast1 = { id: "1", title: "One", open: true }
    const toast2 = { id: "2", title: "Two", open: true }
    let state = { toasts: [toast1, toast2] } as any
    state = reducer(state, { type: "REMOVE_TOAST" } as any)
    expect(state.toasts).toHaveLength(0)
  })

  it("keeps only the most recent toast", () => {
    const toast1 = { id: "1", open: true }
    const toast2 = { id: "2", open: true }
    let state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: toast1 } as any)
    state = reducer(state, { type: "ADD_TOAST", toast: toast2 } as any)
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].id).toBe("2")
  })
})
