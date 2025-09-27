type SocketCache = {
  guest: {
    [key: number]: string
  }
  manager: {
    [key: number]: string
  }
}
export const socketCache: SocketCache = {
  guest: {},
  manager: {}
}
