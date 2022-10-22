class Promise2{
  state = "pending"
  callbacks = []

  resolve(result){
    nextTick(() => {
      if(this.state != "pending") return
      this.state = 'fulfilled'
      this.callbacks.forEach(handle => {
        if(typeof handle[0] === 'function'){
          let x 
          try {
            //@ts-ignore
            x = handle[0].call(undefined, result)
          } catch(e) {
            //@ts-ignore
            handle[2].reject(e)
          }
          //@ts-ignore
          handle[2].resolveWith(x)
        }
      })
    })
  }
  reject(reason){
    nextTick(() => {
      if(this.state != "pending") return
      this.state = 'rejected'
      this.callbacks.forEach(handle => {
        if(typeof handle[1] === 'function'){
          let x 
          try {
            //@ts-ignore
            x = handle[1].call(undefined, reason)
          } catch(e) {
            //@ts-ignore
            handle[2].reject(e)
          }
          //@ts-ignore
          handle[2].resolveWith(x)
        }
      })
    })
  }

  constructor(fn){
    if(typeof fn != 'function'){
      throw new Error("我只接受函数")
    }
    fn(this.resolve.bind(this), this.reject.bind(this))
  }

  then(succeed?, fail?){
    const handle = []
    if(typeof succeed === 'function'){
      //@ts-ignore
      handle[0] = succeed
    }
    if(typeof fail === 'function'){
      //@ts-ignore
      handle[1] = fail
    }
    //@ts-ignore
    handle[2] = new Promise2(() => {})
    //@ts-ignore
    this.callbacks.push(handle)
    return handle[2]
  }
  resolveWith(x) {
    if(this === x){
      return this.reject(new TypeError())
    }
    if(x instanceof Promise2){
      x.then(
        result => {
          this.resolve(result)
        },
        reason => {
          this.reject(reason)
        }
      )
    }
    if(x instanceof Object){
      let then
      try {
        then = x.then
      } catch (e) {
        this.reject(e)
      }
      if(then instanceof Function){
        try {
          x.then(
            y => {
              this.resolveWith(y)
            }, 
            r => {
              this.reject(r)
            })
        } catch (e){
          this.reject(e)
        }
      }else{
        this.resolve(x)
      }
    } else {
      this.resolve(x)
    }
  }
}

export default Promise2

function nextTick(fn) {
  if (process != undefined && typeof process.nextTick === 'function'){
    return process.nextTick(fn)
  } else {
    var counter = 1
    var observer = new MutationObserver(fn)
    var textNode = document.createTextNode(String(counter))

    observer.observe(textNode, {
      characterData: true
    })

    counter = counter + 1
    textNode.data = String(counter)
  }
}