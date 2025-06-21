/** wrapper object so it can be dynamically set when game state is loaded */
export class PersistentState<T> {
  value: T
  constructor (initValue: T) {
    this.value = initValue
  }

  /** alias for `value` but shorter, you can use it if you want */
  get v (): T {
    return this.value
  }
}

export function state <T>(initValue: T) : PersistentState<T> {
  let value = initValue
  // return (newValue) => {
  //   if (newValue !== undefined){
  //     value=newValue
  //   }
  //   return value
  // }
  return new PersistentState(initValue)
}
