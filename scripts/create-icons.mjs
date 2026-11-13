import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
const crcTable = Array.from({ length: 256 }, (_, n) => { let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0; });
function crc(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type);const length=Buffer.alloc(4);length.writeUInt32BE(data.length);const check=Buffer.alloc(4);check.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([length,name,data,check]);}
function png(size){
  const pixels=Buffer.alloc(size*(size*4+1));
  function lineDistance(x,y,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1;const t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-x1-t*dx,y-y1-t*dy);}
  const lines=[[35,54,65,50],[65,50,96,61],[96,61,127,50],[127,50,157,54],[35,54,35,137],[157,54,157,137],[35,137,65,133],[65,133,96,145],[96,145,127,133],[127,133,157,137],[96,61,96,145],[53,78,78,82],[53,99,78,103],[114,82,139,78],[114,103,139,99]];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const px=x*192/size,py=y*192/size;const off=y*(size*4+1)+1+x*4;const ink=lines.some(l=>lineDistance(px,py,...l)<4);const color=ink?[255,248,233]:[37,78,67];pixels.set([...color,255],off);}
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
await mkdir('assets',{recursive:true});
for(const size of [192,512])await writeFile(`assets/icon-${size}.png`,png(size));
console.log('Created install icons');
