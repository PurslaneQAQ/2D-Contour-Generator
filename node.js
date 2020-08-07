var Node = function(_x,_y) {
	this.x = _x;
	this.y = _y;
};

Node.lerp = function(a, b, t)
{
    return new Node((1-t)*a.x + t*b.x, (1-t)*a.y + t*b.y);
}

// Customized
Node.dot = function(n1, n2)
{
    return  (n1.x * n2.x + n1.y + n2.y);
}

Node.cross = function(n1, n2)
{
    return n1.x * n2.y - n1.y * n2.x;
}

Node.area = function(n1, n2)
{
    return Math.abs((n1.x * n2.y - n1.y * n2.x)) / 2;
}

Node.sub = function(n1, n2)
{
    node = new Node(n1.x - n2.x, n1.y - n2.y)
    return node;
}

Node.sum = function(n1, n2)
{
    node = new Node(n1.x + n2.x, n1.y + n2.y)
    return node;
}

NODERADIUS = 4;

Node.prototype.setPos = function(_x,_y)
{
    this.x = _x;
	this.y = _y;
}

// Set the node's x and y coordinates by linearly interpolating from a to b by a factor t
Node.prototype.lerp = function(a, b, t)
{
	this.x = (1-t)*a.x + t*b.x;
	this.y = (1-t)*a.y + t*b.y;
}

Node.prototype.draw = function(ctx)
{
    drawCircle(ctx, this.x, this.y , NODERADIUS);
}

Node.prototype.multiply = function(len)
{
    return new Node(this.x*len, this.y*len);
}

Node.prototype.sum = function(n2)
{
    return Node.sum(this, n2);
}

Node.prototype.isInside = function(px,py, r)
{
    var dist = (px-this.x)*(px-this.x) + (py-this.y)*(py-this.y);
    if(!r){var radius = (NODERADIUS)*(NODERADIUS);}
    else var radius = r*r;
    return dist <= radius;
}

// Customized function
Node.prototype.length = function()
{
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

Node.prototype.length2 = function()
{
    return this.x * this.x + this.y * this.y;
}