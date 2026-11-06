/** A shared material pass plus one batched particle pass; no per-particle DOM or draw calls. */
export const materialVertex = `attribute vec2 position;varying vec2 uv;void main(){uv=position;gl_Position=vec4(position,0.,1.);}`;
export const materialFragment = `precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform vec4 framing;
uniform vec4 optics;
uniform vec2 pointer;
uniform float time;
mat2 rotate(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float boxLight(vec3 d,vec3 c,vec2 size){vec3 f=normalize(c),r=normalize(cross(vec3(0.,1.,0.),f)),u=cross(f,r);float z=dot(d,f);vec2 q=vec2(dot(d,r),dot(d,u))/max(z,.01);return (1.-smoothstep(0.,.045,max(abs(q.x)-size.x,abs(q.y)-size.y)))*step(.01,z);}
vec3 studio(vec3 d){
  vec3 silver=mix(vec3(.91,.94,.96),vec3(.96,.87,.7),optics.y*.38);
  vec3 c=vec3(.024)+vec3(.035)*max(0.,d.y);
  c+=silver*boxLight(d,vec3(-2.,2.,2.),vec2(.19,1.2));
  c+=vec3(.75,.78,.79)*boxLight(d,vec3(2.,.5,1.),vec2(.08,1.5));
  c+=silver*.6*boxLight(d,vec3(0.,3.,-1.),vec2(1.,.15));
  c+=silver*.18*pow(max(0.,dot(d,normalize(vec3(-1.,.8,-2.)))),12.);
  c+=vec3(.17)*pow(max(0.,1.-abs(d.y+.2)*2.5),8.);
  return c;
}
vec3 metal(vec3 n,vec3 rd,float shade){float edge=pow(1.-max(0.,dot(-rd,n)),3.);return (studio(reflect(rd,n))*.95+vec3(.15)*edge)*shade;}
void main(){
 vec2 s=uv;s.x*=resolution.x/resolution.y;
 vec2 drift=vec2(framing.x*.24,framing.y*.35)+pointer*vec2(.12,.08);
 vec2 p=(s-drift)/(1.+(framing.z-1.)*.22);
 vec3 ro=vec3(0.,0.,5.),rd=normalize(vec3(p*1.9,-3.8));
 vec3 col=mix(vec3(.022,.025,.026),vec3(.029,.027,.022),optics.y);
 col+=vec3(.012)*sin(s.x*.7+s.y*.6+optics.z*5.);
 float aa=2.4/resolution.y;
 // Three broad, twisted reflective ribbons run through the complete environment.
 for(int j=0;j<3;j++){
  float f=float(j);vec2 q=rotate(-.48+f*.43+optics.x*.18)*s;
  float phase=time*.16+f*2.2+optics.z*3.8;
  float line=sin(q.x*1.35+phase)*(.35+f*.06)+(.32-f*.34);
  float width=.025+(.035+.028*sin(q.x*.9+phase))*(1.+f*.25);
  float dist=q.y-line;
  float cover=1.-smoothstep(width-aa,width+aa,abs(dist));
  float roll=clamp(dist/width,-1.,1.);
  vec3 n=normalize(vec3(-cos(q.x*1.35+phase)*.55,roll,sqrt(max(.001,1.-roll*roll))));
  n.xy=rotate(.48-f*.43-optics.x*.18)*n.xy;
  vec3 foil=metal(n,normalize(vec3(s,-3.)),.66)+vec3(.02);
  col=mix(col,foil,cover*.76);
 }
 // Fine elliptical filaments give the forms a shared orbital structure.
 for(int j=0;j<3;j++){
  float f=float(j);vec2 q=rotate(.35+f*.68+optics.x*.4)*s;
  q-=vec2(sin(time*.04+f)*.18,cos(time*.035+f)*.12);
  float d=abs(length(q*vec2(.57+f*.035,1.15+f*.12))-(.72+f*.27));
  float line=1.-smoothstep(aa*.4,aa*1.3,d);
  col+=mix(vec3(.17,.19,.2),vec3(.22,.2,.15),optics.y)*line*.65;
 }
 // Analytic ellipsoids are dramatically cheaper than raymarching one object per pixel.
 float nearest=100.;vec3 normal=vec3(0.);float shade=1.;
 for(int i=0;i<12;i++){
  float f=float(i),phase=f*2.399963+optics.x*.65+time*(.085+mod(f,3.)*.026);
  float radius=1.65+fract(f*.618)*1.8;
  vec3 center=vec3(cos(phase)*radius,sin(phase)*radius*.64,sin(f*1.7+time*.07)*.75);
  center.xy+=vec2(.48,-.04)+vec2(sin(time*.3+f),cos(time*.24+f))*.13;
  float size=.12+fract(f*.371)*.3;
  if(i==0){center=vec3(1.23+sin(time*.09)*.15,.24+cos(time*.12)*.16,.3);size=.77;}
  if(i==1){center=vec3(-1.8+sin(time*.07)*.2,-.63,.7);size=.4;}
  vec3 axes=vec3(1.+sin(f+time*.16)*.22,1.+cos(f*1.4+time*.14)*(.19+framing.w*.13),1.);
  if(mod(f,3.)<.5)axes.y*=1.35;
  axes*=size;
  vec3 oc=(ro-center)/axes,dir=rd/axes;
  float a=dot(dir,dir),b=dot(oc,dir),c=dot(oc,oc)-1.,disc=b*b-a*c;
  if(disc>0.){float t=(-b-sqrt(disc))/a;if(t>0.&&t<nearest){nearest=t;vec3 local=(ro+rd*t-center)/axes;normal=normalize(local/axes);normal=normalize(normal+sin(local.yzx*7.+time*.3+f)*(.035+framing.w*.055));shade=.85+fract(f*.23)*.15;}}
 }
 if(nearest<99.){col=metal(normal,rd,shade)+vec3(.014);}
 float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
 gl_FragColor=vec4(col+noise/650.,1.);
}`;

export const particleVertex = `attribute vec4 seed;uniform vec2 resolution;uniform vec2 pointer;uniform float time;uniform float progress;varying float alpha;varying float kind;varying float angle;
void main(){
 float depth=.2+seed.z*.8;float phase=seed.w*6.28318;
 vec2 p=seed.xy*2.-1.;
 p.y=mod(p.y+time*.032*depth+progress*(.6+depth),2.4)-1.2;
 p.x+=sin(time*.18+phase+p.y*3.)*.09+sin(progress*6.+phase)*.16;
 vec2 tangent=vec2(-p.y,p.x);p+=tangent*sin(time*.1+phase)*.035*depth;
 p+=pointer*.035*depth;
 float c=cos(progress*.24),s=sin(progress*.24);p=mat2(c,-s,s,c)*p;
 gl_Position=vec4(p,0.,1.);
 kind=step(.994,seed.w);angle=phase+time*.045;
 float density=min(resolution.x/900.,1.3);
 gl_PointSize=max(1.,(.65+seed.z*1.6)*(1.+kind*2.6)*max(.55,density));
 alpha=(.1+seed.z*.35)*(1.-kind*.1);
}`;
export const particleFragment = `precision mediump float;varying float alpha;varying float kind;varying float angle;
void main(){vec2 p=gl_PointCoord*2.-1.;float c=cos(angle),s=sin(angle);p=mat2(c,-s,s,c)*p;float dotShape=1.-smoothstep(.12,1.,length(p));float flake=(1.-smoothstep(.06,.22,abs(p.x)))*(1.-smoothstep(.4,1.,abs(p.y)));flake=max(flake,(1.-smoothstep(.04,.16,abs(p.y)))*(1.-smoothstep(.2,.8,abs(p.x))));float a=mix(dotShape,flake,kind)*alpha;if(a<.015)discard;gl_FragColor=vec4(mix(vec3(.76,.8,.8),vec3(.88,.81,.65),kind),a);}`;
