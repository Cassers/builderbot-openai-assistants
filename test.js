const originalText = `6. *Modelo Alaska - Negro*
   - Precio: $149,900
   - ![Alaska Negro](https://res.cloudinary.com/dubmc8beu/image/upload/v1727352658/Clock%20Footwear/yueo1kuuzbwvtiuqzvt7.jpg)`

// reformat from ![Alaska Azul](https://res.cloudinary.com/dubmc8beu/image/upload/v1727352658/Clock%20Footwear/lkqcvgncfq8jidbmurvt.jpg) to [image:https://res.cloudinary.com/dubmc8beu/image/upload/v1727352658/Clock%20Footwear/lkqcvgncfq8jidbmurvt.jpg]

let imagesChunk = originalText.replace(/!\[.*?\]\((.*?)\)/g, '[image:$1]')

console.log(imagesChunk)