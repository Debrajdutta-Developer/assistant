// Minimal OOXML writers. Uses only Node built-ins so files also generate in Termux.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const utf=s=>Buffer.from(s,'utf8');
const crc=buf=>{let c=~0;for(const n of buf){c^=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(~c)>>>0;};
function zip(entries){let offset=0;const locals=[],central=[];for(const [name,content] of Object.entries(entries)){
 const data=Buffer.isBuffer(content)?content:utf(content),nameBytes=utf(name),sum=crc(data);
 const lh=Buffer.alloc(30);lh.writeUInt32LE(0x04034b50);lh.writeUInt16LE(20,4);lh.writeUInt32LE(sum,14);lh.writeUInt32LE(data.length,18);lh.writeUInt32LE(data.length,22);lh.writeUInt16LE(nameBytes.length,26);
 locals.push(lh,nameBytes,data);
 const cd=Buffer.alloc(46);cd.writeUInt32LE(0x02014b50);cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);cd.writeUInt32LE(sum,16);cd.writeUInt32LE(data.length,20);cd.writeUInt32LE(data.length,24);cd.writeUInt16LE(nameBytes.length,28);cd.writeUInt32LE(offset,42);
 central.push(cd,nameBytes);offset+=lh.length+nameBytes.length+data.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(entries).length,8);end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,directory,end]);
}
export function makeDocx(title,body){
 const paragraphs=body.split(/\r?\n/).filter(Boolean).slice(0,150).map(line=>'<w:p><w:r><w:t xml:space="preserve">'+esc(line)+'</w:t></w:r></w:p>').join('');
 const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>'+esc(title)+'</w:t></w:r></w:p>'+paragraphs+'<w:sectPr/></w:body></w:document>';
 return zip({'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/document.xml':xml});
}
const pText=(text,x,y,w,h,size,bold=false)=>'<p:sp><p:nvSpPr><p:cNvPr id="'+(Math.abs(x+y)+2)+'" name="Text"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+w+'" cy="'+h+'"/></a:xfrm></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="'+size+'" b="'+(bold?1:0)+'"><a:solidFill><a:srgbClr val="EDF6FF"/></a:solidFill></a:rPr><a:t>'+esc(text)+'</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>';
export function makePptx(title,body){
 const lines=body.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,24),slides=[{heading:title,lines:[]}];
 for(let i=0;i<lines.length;i+=5)slides.push({heading:lines[i].replace(/^#+\s*/,''),lines:lines.slice(i+1,i+5)});
 const entries={
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>'+slides.map((_,i)=>'<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('')+'</Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>',
 'ppt/_rels/presentation.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+slides.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+(i+1)+'.xml"/>').join('')+'</Relationships>',
 'ppt/presentation.xml':'<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>'+slides.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(i+1)+'"/>').join('')+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'
 };
 slides.forEach((slide,i)=>{const parts=[pText(slide.heading,800000,650000,10600000,1200000,4000,true),...slide.lines.map((l,j)=>pText('• '+l.replace(/^[-•]\s*/,''),1000000,2000000+j*850000,10000000,750000,2400))];entries['ppt/slides/slide'+(i+1)+'.xml']='<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="10213B"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+parts.join('')+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';});
 return zip(entries);
}
