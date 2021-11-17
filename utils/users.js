const users = [];

function checkIfUserExists(username, room) {
  return users.find((user) => user.username === username && user.room === room);
}

function userJoin(id, username, room, eventId) {
  const user = {
    id,
    username,
    room,
    eventId,
  };
  users.push(user);

  return user;
}

function getUserById(id) {
  return users.find((user) => user.id === id);
}

function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

function getUsers() {
  return users;
}

module.exports = {
  userJoin,
  getUserById,
  userLeave,
  getRoomUsers,
  getUsers,
};
