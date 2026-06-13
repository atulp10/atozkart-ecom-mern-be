export function toUserDto(user) {
  return { _id: user._id, username: user.username, email: user.email, role: user.role };
}
