// The total number of server ticks in one second
// TEMP: lowered from 25 to see if low tick rate is noticeable thanks to interpolation
export const NUM_SERVER_TICKS = 10;

// The length of one tick on the server in milliseconds
export const SERVER_GAME_TICK = 1000 / NUM_SERVER_TICKS;
