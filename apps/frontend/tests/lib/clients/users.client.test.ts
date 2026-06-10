import { describe, expect, it } from "vitest"
import { UsersClient } from "@/lib/clients/users.client"
import { server } from "../../msw/server"
import {
  createUserSuccess,
  getUser,
  listUsersPaged,
  makeUser,
  makeUsers,
  updateUserSuccess,
} from "../../msw/users.handlers"

describe("UsersClient", () => {
  it("list returns { count, items } and forwards limit/offset", async () => {
    const all = makeUsers(25)
    const capture: { limit?: number; offset?: number } = {}
    server.use(listUsersPaged(all, capture))

    const result = await UsersClient.list({ limit: 10, offset: 20 })

    expect(capture.limit).toBe(10)
    expect(capture.offset).toBe(20)
    expect(result.count).toBe(25)
    expect(result.items).toHaveLength(5)
    expect(result.items[0].id).toBe("u-21")
  })

  it("getById reads role from the response (response speaks role)", async () => {
    const user = makeUser({ id: "u-7", role: "admin" })
    server.use(getUser(user))

    const result = await UsersClient.getById("u-7")

    expect(result.role).toBe("admin")
    expect(result).not.toHaveProperty("userRole")
  })

  it("create maps role -> userRole on the wire and reads role back", async () => {
    const capture: { body?: Record<string, unknown> } = {}
    server.use(createUserSuccess(capture, makeUser({ id: "u-new", role: "admin" })))

    const result = await UsersClient.create({
      email: "new@vulkan.test",
      name: "New",
      lastName: "User",
      password: "supersecret",
      role: "admin",
      status: "ACTIVE",
    })

    expect(capture.body?.userRole).toBe("admin")
    expect(capture.body).not.toHaveProperty("role")
    expect(capture.body?.email).toBe("new@vulkan.test")
    expect(capture.body?.password).toBe("supersecret")
    expect(result.role).toBe("admin")
  })

  it("update maps role -> userRole and omits role when undefined", async () => {
    const target = makeUser({ id: "u-3", role: "sales", status: "INACTIVE" })
    const capture: { body?: Record<string, unknown>; id?: string } = {}
    server.use(updateUserSuccess(target, capture))

    await UsersClient.update("u-3", { role: "sales", name: "Renamed" })

    expect(capture.id).toBe("u-3")
    expect(capture.body?.userRole).toBe("sales")
    expect(capture.body?.name).toBe("Renamed")
    expect(capture.body).not.toHaveProperty("role")
  })

  it("update omits userRole entirely when role is not in the patch", async () => {
    const target = makeUser({ id: "u-3", status: "INACTIVE" })
    const capture: { body?: Record<string, unknown> } = {}
    server.use(updateUserSuccess(target, capture))

    const result = await UsersClient.update("u-3", { status: "INACTIVE" })

    expect(capture.body).not.toHaveProperty("userRole")
    expect(capture.body).not.toHaveProperty("role")
    expect(capture.body?.status).toBe("INACTIVE")
    expect(result.status).toBe("INACTIVE")
  })
})
