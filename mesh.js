var Mesh = function(dCanvas, manager, data, id)
{
    CanvasLayer.call(this, dCanvas, manager, id);
    this.vtx = [];
    this.elements = [];
    this.centers = [];
    this.weights = [];
    // console.log($(pic)[0].width);
    let lines = data.split("\n");
    let vtxNum = parseInt(lines[0]);
    for(let i = 0; i < vtxNum; i++){
      let pt = lines[i+1].split(" ");
      this.vtx.push(new Node(parseFloat(pt[0])/5*this.dCanvas.width + this.dCanvas.width/2, -parseFloat(pt[1])/5*this.dCanvas.width + this.dCanvas.height/2));
    }
    let elementNum = parseInt(lines[vtxNum+1]);
    for(let i = 0; i < elementNum; i++){
      let _ele = lines[i+vtxNum+2].split(" ");
      let ele = [parseInt(_ele[0]), parseInt(_ele[1]), parseInt(_ele[2])];
      this.elements.push(ele);
      this.centers.push(this.vtx[ele[0]].sum(this.vtx[ele[1]]).sum(this.vtx[ele[2]]).multiply(1/3));
      this.weights.push(-1);
    }
    // console.log(this.vtx);
    // console.log(this.elements);
    //this.repaint();// Do this when color changed or resized
    //console.log(this.width + " " + this.height);
}

Mesh.prototype.delete = function(){
  this.vtx.length = 0;
  this.elements.length = 0;
  this.status = -1;
}

Mesh.prototype.paint = function({x, y}, brushWeight, brushSize){
  const pos = new Node(x, y);
  if(brushSize !== 0){
    const brushSize2 = brushSize * brushSize;
    for(const [i, center] of this.centers.entries()){
      if(Node.sub(center, pos).length2() < brushSize2){
        this.weights[i] = brushWeight;
      }
    }
    return;
  }
  for(const [i, element] of this.elements.entries()){
    let flag = 1;
    for (let j = 0; j < 3; j++){
      const pj_p = Node.sub(pos, this.vtx[element[j]]);
      const pj_next = Node.sub(this.vtx[element[(j+1)%3]], this.vtx[element[j]]);
      const pj_prev = Node.sub(this.vtx[element[(j+2)%3]], this.vtx[element[j]]);
      if(Node.cross(pj_next, pj_p) * Node.cross(pj_next, pj_prev) < 0){
        flag = 0;
        break;
      }
    }
    if(flag){
      this.weights[i] = brushWeight;
      break;
    }
  }
}

Mesh.prototype.export = function(){
  let data = '';
  data += this.vtx.length + '\n';
  data += this.vtx.map((vertice) => {
    return (`${vertice.x} ${vertice.y}`);
  }).join('\n');
  data += this.elements.length + '\n';
  data += this.elements.map((element) => {
    return (`${element[0]} ${element[1]} ${element[2]}`);
  }).join('\n');
  data += '\n';
  data += this.weights.map((weight) => {
    return (`${weight > 0 ? weight:this.manager.meshBaseWeight}`);
  }).join('\n');
  return data;
}

Mesh.prototype.draw = function(){
  const _draw = (_ctx) => {
    const ctx = _ctx||this.ctx;
    for(const [i, element] of this.elements.entries()){
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(this.vtx[element[0]].x, this.vtx[element[0]].y);
      ctx.lineTo(this.vtx[element[1]].x, this.vtx[element[1]].y);
      ctx.lineTo(this.vtx[element[2]].x, this.vtx[element[2]].y);
      let hue = this.weights[i] * 100;
      if(hue < 0){
        hue = this.manager.meshBaseWeight * 100;
      }
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.fill();
      ctx.lineTo(this.vtx[element[0]].x, this.vtx[element[0]].y);
      ctx.stroke();
    }
    if(_ctx) {
      let left = this.dCanvas.width;
      let top = this.dCanvas.height;
      let right = 0;
      let bottom = 0;
      this.vtx.forEach((vt) => {
        if(vt.x < left){
          left = vt.x;
        } else if(vt.x > right){
          right = vt.x;
        }
        if(vt.y < top){
          top = vt.y;
        } else if(vt.y > bottom){
          bottom = vt.y;
        }
      });
      this.left = left-10;
      this.top = top-10;
      this.width = right - left + 20;
      this.height = bottom - top + 20;
    }
  }
  if(this.status !== 2){
    if(this.change){
      this.saveDraw((ctx)=>{
        _draw(ctx);
      });
      this.change = false;
    }
    this.defaultDraw();
  }else{
    _draw(this.ctx);
  }
}

// Mesh.prototype.repaint = function(color){
//     this.ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
//     // Adapted from https://segmentfault.com/a/1190000011880686
//     const originColor = this.ctx.getImageData(this.left, this.top, this.width, this.height); 
//     const originColorData = originColor.data
//     const output = this.ctx.createImageData(this.width, this.height) 
//     const outputData = output.data;
//     this.changeColor(originColorData, outputData, this.width, this.height, color);
//     this.picData = output;
// }
