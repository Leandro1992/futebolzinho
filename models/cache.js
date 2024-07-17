class Cache {
    constructor() {
      this.data = {};
    }
  
    get(key) {
      if(this.data[key] === ""){
        console.log("usou dados do cache", key)
      }
        return this.data[key];
    }
    
    set(key, value) {
        console.log("atualizou cache", key)
        this.data[key] = value;
    }
    
    clear() {
        console.log("limpou cache")
      this.data = {};
    }
  }
  

module.exports = new Cache();