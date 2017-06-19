const playerStore = {};

const acd3 = {

  drawBubble: function(data, config) {

    const diameter = config.diameter;
    let zoom = config.zoom;

    let g;
    let foreignObject;
    let div;
    let video;
    let circle;

    const bubble = d3.pack(data)
        .size([diameter, diameter])
        .padding(1.5);

    const svg = d3.select("#" + config.htmlAnchorID)
        .append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

    //calculates radius, x and y positions for all child nodes
    const root = d3.hierarchy(data)
        .sum(function (d) { return d.scalingParameter; });

    const node = svg.selectAll(".node")
        .data(bubble(root).descendants())
        .enter()
        //only keeps objects that don't have children property
        .filter((d) => !d.children)

    //support for firefox
    if (typeof InstallTrigger !== 'undefined') {
        g = node.append('g')
            .attr("class", "node")
            .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")

        foreignObject = g.append('foreignObject')
            .attr('width', (d) => d.r * 2)
            .attr('height', (d) => d.r * 2)
            .attr('x', (d) => -d.r)
            .attr('y', (d) => -d.r)
            .style('pointer-events', 'none');

        video = foreignObject.append((d) => {
            //check src to determine whether element should be html5 video or iframe

            return d.data.type === 'video'
                ? document.createElement('video')
                : document.createElement('iframe');
        })

            //html5 video attributes
            .property('volume', (d) => d.data.type === 'video' ? '0.0' : null)
            .attr('autoplay', (d) => d.data.type === 'video' ? '' : null)
            .attr('loop', (d) => d.data.type === 'video' ? '' : null)

            //iframe attributes
            .attr('frameborder', (d) => d.data.type === 'iframe' ? 0 : null)

            //shared attributes
            .attr('id', (d) => d.data.v_id)
            .attr('src', (d) => d.data.src)
            .style('border-radius', '50%')
            .style('object-fit', 'cover')
            .style('width', '100%')
            .style('height', '100%');

        //position circle below video bubble to handle mouse events
        circle = g.append("circle")
            .attr("r", (d) => d.r)
            .on('mouseenter', handleMouseEnter)
            .on('mouseleave', handleMouseLeave);
    }

    //support for chrome
    else {
        g = node.append('g')

        foreignObject = g.append('foreignObject')
            .attr('x', (d) => d.x - d.r)
            .attr('y', (d) => d.y - d.r)
            .style('pointer-events', 'none');

        div = foreignObject.append('xhtml:div')
            .style('width', (d) => (d.r * 2) + 'px')
            .style('height', (d) => (d.r * 2) + 'px')
            .style('border-radius', (d) => d.r + 'px')
            .style('-webkit-mask-image', '-webkit-radial-gradient(circle, white 100%, black 100%)')
            .style('position', 'relative')

        video = div.append((d) => {
            //check src to determine whether element should be html5 video or iframe
            return d.data.type === 'video'
                ? document.createElement('video')
                : document.createElement('iframe');
        })

            //html5 video attributes
            .property('volume', (d) => d.data.type === 'video' ? '0.0' : null)
            .attr('autoplay', (d) => d.data.type === 'video' ? '' : null)
            .attr('loop', (d) => d.data.type === 'video' ? '' : null)
            .style('object-fit', (d) => d.data.type === 'video' ? 'cover' : null)

            //iframe attributes
            .attr('frameborder', (d) => d.data.type === 'iframe' ? 0 : null)

             //shared attributes
            .attr('id', (d) => d.data.v_id)
            .attr("xmlns", "http://www.w3.org/1999/xhtml")
            .attr('src', (d) => d.data.src)
            .style('width', (d) => d.data.type === 'youtube' || d.data.type === 'vimeo' ? `${zoom * 100}%` : '100%')
            .style('height', (d) => d.data.type === 'youtube' || d.data.type === 'vimeo' ? `${zoom * 100}%` : '100%')
            .style('top', (d) => d.data.type === 'youtube' || d.data.type === 'vimeo' ? -((zoom - 1) * d.r) + 'px' : null)
            .style('left', (d) => d.data.type === 'youtube' || d.data.type === 'vimeo' ? -((zoom - 1) * d.r) + 'px' : null)
            .style('position', 'absolute');

        //position circle below video bubble to handle mouse events
        circle = g.append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => d.r)
            .on('mouseenter', handleMouseEnter)
            .on('mouseleave', handleMouseLeave);
    }

    //event handlers
    function handleMouseEnter(d, i) {
        console.log('enter')
        let videoID = data.children[i].v_id;
        if (d.data.type === 'vimeo') playerStore[videoID].setVolume(1);
        else if (d.data.type === 'youtube') playerStore[videoID].unMute();
        else playerStore[videoID].volume = 1;
    }

    function handleMouseLeave(d, i) {
        console.log('leave')
        let videoID = data.children[i].v_id;
        if (d.data.type === 'vimeo') playerStore[videoID].setVolume(0);
        else if (d.data.type === 'youtube') playerStore[videoID].mute();
        else playerStore[videoID].volume = 0;
    }

    //still needs to be refactored:
    for (let i = 0; i < data.children.length; i += 1) {
      let videoID = data.children[i].v_id;
      if (data.children[i].type === 'video') {
        playerStore[videoID] = document.getElementById(videoID);
      }
      else if (data.children[i].type === 'vimeo') {
        let vimeoPlayer = new Vimeo.Player(videoID);
        playerStore[videoID] = vimeoPlayer;

        vimeoPlayer.ready().then(function () {
            vimeoPlayer.play();
            vimeoPlayer.setVolume(0);
          });
        }
    }

  }

}