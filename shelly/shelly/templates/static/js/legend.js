(function() {
var legend = Plotly.Legend = {};
// -----------------------------------------------------
// styling functions for traces in legends.
// same functions for styling traces in the style box
// -----------------------------------------------------

legend.lines = function(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(d[0].t.type)==-1) { return; }
    if(t.fill && t.fill!='none' && $.isNumeric(t.cdcurve)) {
        d3.select(this).append('path')
            .attr('data-curve',t.cdcurve)
            .attr('d','M5,0h30v6h-30z')
            .call(Plotly.Drawing.fillGroupStyle);
    }
    if(!t.mode || t.mode.indexOf('lines')==-1) { return; }
    d3.select(this).append('polyline')
        .call(Plotly.Drawing.lineGroupStyle)
        .attr('points','5,0 35,0');

};

legend.points = function(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(t.type)==-1) { return; }
    if(!t.mode || t.mode.indexOf('markers')==-1) { return; }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){ return d; })
      .enter().append('path')
        .call(Plotly.Drawing.pointStyle,t)
        .attr('transform','translate(20,0)');
};

legend.bars = function(d){
    var t = d[0].t;
    if(Plotly.Plots.BARTYPES.indexOf(t.type)==-1) { return; }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){ return d; })
      .enter().append('path')
        .attr('d','M6,6H-6V-6H6Z')
        .each(function(d){
            var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
                p = d3.select(this);
            p.attr('stroke-width',w)
                .call(Plotly.Drawing.fillColor,d.mc || t.mc || (d.t ? d.t.mc : ''));
            if(w) { p.call(Plotly.Drawing.strokeColor,d.mlc || t.mlc || (d.t ? d.t.mlc : '')); }
        })
        .attr('transform','translate(20,0)');
};

legend.boxes = function(d){
    var t = d[0].t;
    if(t.type!=='box') { return; }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){ return d; })
      .enter().append('path')
        .attr('d','M6,6H-6V-6H6Z') // if we want the median bar, prepend M6,0H-6
        .each(function(d){
            var w = (d.lw+1 || t.lw+1 || (d.t ? d.t.lw : 0)+1) - 1,
                p = d3.select(this);
            p.attr('stroke-width',w)
                .call(Plotly.Drawing.fillColor,d.fc || t.fc || (d.t ? d.t.fc : ''));
            if(w) { p.call(Plotly.Drawing.strokeColor,d.lc || t.lc || (d.t ? d.t.lc : '')); }
        })
        .attr('transform','translate(20,0)');
};

function legendText(s,gd){
    var gf = gd.layout.font, lf = gd.layout.legend.font;
    // note: uses d[1] for the original trace number, in case of hidden traces
    return s.append('text')
        .attr('class',function(d){ return 'legendtext text-'+d[1]; })
        .call(Plotly.Drawing.setPosition, 40, 0)
        .attr('text-anchor','start')
        .attr('font-size',lf.size||gf.size||12)
        .attr('font-family',lf.family||gf.family||'Arial')
        .style('fill',lf.color||gf.color||'#000')
        .each(function(d){ Plotly.Drawing.styleText(this,d[0].t.name,d[0].t.noretrieve); });
}

// -----------------------------------------------------
// legend drawing
// -----------------------------------------------------

legend.draw = function(gd) {
    var gl=gd.layout,gm=gl.margin;
    gl.showlegend = true;
    if(!gl.legend) { gl.legend={}; }
    var gll = gl.legend;
    gd.infolayer.selectAll('.legend').remove();
    if(!gd.calcdata) { return; }

    var ldata=[];
    for(var i=0;i<gd.calcdata.length;i++) {
        if(gd.calcdata[i][0].t.visible!==false) {
            ldata.push([gd.calcdata[i][0],i]); // i is appended as d[1] so we know which element of gd.data it refers to
        }
    }

    gd.legend=gd.infolayer.append('svg')
        .attr('class','legend');

    var bordercolor = gll.bordercolor || '#000',
        borderwidth = gll.borderwidth || 1,
        bgcolor = gll.bgcolor || gl.paper_bgcolor || '#fff';
    gd.legend.append('rect')
        .attr('class','bg')
        .call(Plotly.Drawing.strokeColor,bordercolor)
        .attr('stroke-width',borderwidth)
        .call(Plotly.Drawing.fillColor,bgcolor);

    var traces = gd.legend.selectAll('g.traces')
        .data(ldata);
    traces.enter().append('g').attr('class','trace');

    traces.append('g')
        .call(Plotly.Drawing.traceStyle,gd)
        .each(legend.bars)
        .each(legend.boxes)
        .each(legend.lines)
        .each(legend.points);

    var tracetext=traces.call(legendText,gd).selectAll('text');
    if(gd.mainsite) {
        tracetext.on('click',function(){
            if(!gd.dragged) { Plotly.Fx.autoGrowInput(this); }
        });
    }

    // add the legend elements, keeping track of the legend size (in px) as we go
    var legendwidth=0, legendheight=0;
    traces.each(function(d){
        var g=d3.select(this), t=g.select('text'), l=g.select('.legendpoints');
        if(d[0].t.showinlegend===false) {
            g.remove();
            return;
        }
        var tbb = t.node().getBoundingClientRect();
        if(!l.node()) { l=g.select('path'); }
        if(!l.node()) { l=g.select('polyline'); }
        var lbb = (!l.node()) ? tbb : l.node().getBoundingClientRect();
        t.attr('y',(lbb.top+lbb.bottom-tbb.top-tbb.bottom)/2);
        var gbb = this.getBoundingClientRect();
        legendwidth = Math.max(legendwidth,tbb.width);
        g.attr('transform','translate('+borderwidth+','+(5+borderwidth+legendheight+gbb.height/2)+')');
        legendheight += gbb.height+3;
    });
    legendwidth += 45+borderwidth*2;
    legendheight += 10+borderwidth*2;

    // now position the legend. for both x,y the positions are recorded as fractions
    // of the plot area (left, bottom = 0,0). Outside the plot area is allowed but
    // position will be clipped to the page. Special values +/-100 auto-increase
    // the margin to put the legend entirely outside the plot area on the high/low side.
    // Otherwise, values <1/3 align the low side at that fraction, 1/3-2/3 align the
    // center at that fraction, >2/3 align the right at that fraction
    var pw = gl.width-gm.l-gm.r,
        ph = gl.height-gm.t-gm.b;
    // defaults... the check for >10 and !=100 is to remove old style positioning in px
    if(!$.isNumeric(gll.x) || (gll.x>10 && gll.x!=100)) { gll.x=0.98; }
    if(!$.isNumeric(gll.y) || (gll.y>10 && gll.y!=100)) { gll.y=0.98; }

    var lx = gm.l+pw*gll.x,
        ly = gm.t+ph*(1-gll.y),
        pad = 3; // px of padding if legend is outside plot

    // don't let legend be outside plot in both x and y... that would just make big blank
    // boxes. Put the legend centered in y if we somehow get there.
    if(Math.abs(gll.x)==100 && Math.abs(gll.y)==100) { gll.y=0.5; }

    var oldchanged = gd.changed;

    if(gll.x==-100) {
        lx=pad;
        if(gd.lw!=-legendwidth-2*pad) { // if we haven't already, redraw with extra margin
            gd.lw=-legendwidth-2*pad; // make gd.lw to tell newplot how much extra margin to give
            Plotly.relayout(gd,'margin.l',gm.l); // doesn't change setting, just forces redraw
            return;
        }
    }
    else if(gll.x==100) {
        lx=gl.width-legendwidth-pad;
        if(gd.lw!=legendwidth+2*pad) {
            gd.lw=legendwidth+2*pad;
            Plotly.relayout(gd,'margin.r',gm.r);
            return;
        }
    }
    else {
        if(gd.lw) {
            delete gd.lw;
            Plotly.relayout(gd,'margin.r',gm.r);
            return;
        }
        if(gll.x>2/3) { lx -= legendwidth; }
        else if(gll.x>1/3) { lx -= legendwidth/2; }
    }

    if(gll.y==-100) {
        ly=gl.height-legendheight-pad;
        if(gd.lh!=-legendheight-2*pad) {
            gd.lh=-legendheight-2*pad;
            Plotly.relayout(gd,'margin.b',gm.b);
            return;
        }
    }
    else if(gll.y==100) {
        ly=pad+16; // Graph title goes above legend regardless. TODO: get real title size
        if(gd.lh!=legendheight+2*pad) {
            gd.lh=legendheight+2*pad;
            Plotly.relayout(gd,'margin.t',gm.t);
            return;
        }
    }
    else {
        if(gd.lh) {
            delete gd.lh;
            Plotly.relayout(gd,'margin.t',gm.t);
            return;
        }
        if(gll.y<1/3) { ly -= legendheight; }
        else if(gll.y<2/3) { ly -= legendheight/2; }
    }

    // adjusting the margin thusly doesn't by itself constitute a change, so
    // put gd.changed back the way it was
    gd.changed = oldchanged;

    // push the legend back onto the page if it extends off, making sure if nothing else
    // that the top left of the legend is visible
    if(lx+legendwidth>gl.width) { lx=gl.width-legendwidth; }
    if(lx<0) { lx=0; }
    if(ly+legendheight>gl.height) { ly=gl.height-legendheight; }
    if(ly<0) { ly=0; }

    gd.legend.call(Plotly.Drawing.setRect, lx, ly, legendwidth, legendheight);
    gd.legend.selectAll('.bg').call(Plotly.Drawing.setRect,
        borderwidth/2, borderwidth/2, legendwidth-borderwidth, legendheight-borderwidth);

    // user dragging the legend
    // aligns left/right/center on resize or new text if drag pos
    // is in left 1/3, middle 1/3, right 1/3
    // choose left/center/right align via:
    //  xl=(left-ml)/plotwidth, xc=(center-ml/plotwidth), xr=(right-ml)/plotwidth
    //  if(xl<2/3-xc) gll.x=xl;
    //  else if(xr>4/3-xc) gll.x=xr;
    //  else gll.x=xc;
    // similar logic for top/middle/bottom
    if(gd.mainsite) { gd.legend.node().onmousedown = function(e) {
        if(Plotly.Fx.dragClear(gd)) { return true; } // deal with other UI elements, and allow them to cancel dragging

        var eln=this,
            el3=d3.select(this),
            x0=Number(el3.attr('x')),
            y0=Number(el3.attr('y')),
            xf = null,
            yf = null;
        gd.dragged = false;
        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY,
                gdm = gd.margin,
                MINDRAG = Plotly.Fx.MINDRAG;
            if(Math.abs(dx)<MINDRAG) { dx=0; }
            if(Math.abs(dy)<MINDRAG) { dy=0; }
            if(dx||dy) { gd.dragged = true; }
            el3.call(Plotly.Drawing.setPosition, x0+dx, y0+dy);
            var pbb = gd.paperdiv.node().getBoundingClientRect();

            // drag to within a couple px of edge to take the legend outside the plot
            if(e2.clientX>pbb.right-3*MINDRAG || (gd.lw>0 && dx>-MINDRAG)) { xf=100; }
            else if(e2.clientX<pbb.left+3*MINDRAG || (gd.lw<0 && dx<MINDRAG)) { xf=-100; }
            else { xf = Plotly.Fx.dragAlign(x0+dx,legendwidth,gdm.l,gl.width-gdm.r); }

            if(e2.clientY>pbb.bottom-3*MINDRAG || (gd.lh<0 && dy>-MINDRAG)) { yf=-100; }
            else if(e2.clientY<pbb.top+3*MINDRAG || (gd.lh>0 && dy<MINDRAG)) { yf=100; }
            else { yf = 1-Plotly.Fx.dragAlign(y0+dy,legendheight,gdm.t,gl.height-gdm.b); }

            var csr = Plotly.Fx.dragCursors(xf,yf);
            $(eln).css('cursor',csr);
            return Plotly.Lib.pauseEvent(e2);
        };
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            $(eln).css('cursor','');
            if(gd.dragged && xf!==null && yf!==null) {
                Plotly.relayout(gd,{'legend.x':xf,'legend.y':yf});
            }
            return Plotly.Lib.pauseEvent(e2);
        };
        return Plotly.Lib.pauseEvent(e);
    }; }
};

}()); // end Legend object definition