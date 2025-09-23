import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FullBG from '../components/FullBG';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

export default function LoaderScreen({ navigation }: Props) {
  //useEffect(() => {
  //  const t = setTimeout(() => navigation.replace('Onboarding'), 5600);
  //  return () => clearTimeout(t);
  //}, [navigation]);

  const html = useMemo(
    () => `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  html,body{margin:0; padding:0; background:transparent; overflow:hidden;}
  canvas{display:block;}
</style>
</head>
<body>
<canvas></canvas>
<script>
// === JS1K dragons  ===
var a = document.getElementsByTagName('canvas')[0];
a.width = innerWidth; a.height = innerHeight;
a.style.width = a.width + 'px'; a.style.height = a.height + 'px';
var c = a.getContext('2d');
var sw = a.width, sh = a.height, M = Math, Mc = M.cos, Ms = M.sin, ran = M.random,
    pfloat = 0, pi = M.PI, dragons = [], shape = [], i, j;

var loop = function() {
  a.width = sw;               
  c.fillStyle = '#E89E01';   
  for ( j = 0; j < 7; j++) { if ( !dragons[j] ) dragons[j] = dragon(j); dragons[j](); }
  pfloat++; requestAnimationFrame(loop);
};

var dragon = function(index) {
  var scale = 0.1 + index * index / 49, 
      gx = ran() * sw / scale, gy = sh / scale, lim = 300,
      speed = 3 + ran() * 5, direction = pi, direction1 = direction, spine = [];

  return function() {
    if (gx < -lim || gx > sw / scale + lim || gy < -lim || gy > sh / scale + lim) {
      var dx = sw / scale / 2 - gx, dy = sh / scale / 2 - gy;
      direction = direction1 = M.atan(dx/dy) + (dy < 0 ? pi : 0);
    } else {
      direction1 += ran() * .1 - .05; direction -= (direction - direction1) * .1;
    }
    gx += Ms(direction) * speed; gy += Mc(direction) * speed;

    for (i=0; i < 70; i++) {
      if (i) {
        if (!pfloat) spine[i] = {x: gx, y: gy}
        var p = spine[i - 1], dx = spine[i].x - p.x, dy = spine[i].y - p.y,
            d = M.sqrt(dx*dx + dy*dy), perpendicular = M.atan(dy/dx) + pi/2 + (dx < 0 ? pi : 0);
        var mod = d > 4 ? .5 : d > 2 ? (d - 2)/4 : 0;
        spine[i].x -= dx * mod; spine[i].y -= dy * mod;
        spine[i].px = Mc(perpendicular); spine[i].py = Ms(perpendicular);
        if (i == 20) { var wingPerpendicular = perpendicular; }
      } else {
        spine[i] = {x: gx, y: gy, px: 0, py: 0};
      }
    }

    c.beginPath();
    c.moveTo(spine[0].x,spine[0].y);
    for (i=0; i < 154; i+=2) {
      var index = i < 77 ? i : 152 - i;
      var L = i < 77 ? 1 : -1;
      var x = shape[index];
      var spineNode = spine[shape[index+1]];

      if (index >= 56) {
        var wobbleIndex = 56 - index;
        var wobble = Ms(wobbleIndex / 3 + pfloat * 0.1) * wobbleIndex * L;
        x = 20 - index / 4 + wobble;
        spineNode = spine[ index * 2 - 83 ];
      } else if (index > 13) {
        x = 4 + (x-4) * (Ms(( -x / 2 + pfloat) / 25 * speed / 4) + 2) * 2;
        spineNode.px = Math.cos(wingPerpendicular);
        spineNode.py = Math.sin(wingPerpendicular);
      }

      c.lineTo( (spineNode.x + x * L * spineNode.px) , (spineNode.y + x * L * spineNode.py) );
    }
    c.closePath();
    c.fill();
  }
};

'! ((&(&*$($,&.)/-.0,4%3"7$;(@/EAA<?:<9;;88573729/7,6(8&;'.split("").map(function(a,i){ shape[i] = a.charCodeAt(0) - 32; });
loop();
</script>
</body>
</html>`,
    []
  );

  return (
    <FullBG>
      <View style={styles.fill}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          javaScriptEnabled
          scrollEnabled={false}
          androidLayerType="hardware"
          automaticallyAdjustContentInsets={false}
        />
      </View>
    </FullBG>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
