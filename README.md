# flot.gauge
Gauge plugin for [Flot](http://www.flotcharts.org/) plotting library

**features:**
- simgle arc gauge with threshold marks
- single gauge or multi gauge on a canvas
- threshold-based color of gauge
- many options to configure gauge

![image](flot.gauge.png)


## How to use
Include this plugin after jQuery and jquery.flot.

### Basics

```js
var data = [
    {
        label: "data1",
        data: [[0, 75]]
    }
];
var options = {
    series: {
        gauges: {
            show: true
        }
    }
};

$("#placeholder").width(600)
                 .height(600)
                 .plot(data, options);
```

The advanced example can be seen in the [examples](examples) folder.

### Plugin Options

```js
gauges: {
    debug: {
        log: false,
        layout: false,
        alert: false
    },
    show: true,
    layout: {
        margin: 5,
        columns: 3,
        hMargin: 5,
        vMargin: 5,
        square: false
    },
    cell: {
        background: {
            color: null
        },
        border: {
            color: "black",
            width: 1
        },
        margin: 5,
        vAlign: "middle" // 'top' or 'middle' or 'bottom'
    },
    gauge: {
        width: "auto", // a specified number, or 'auto'
        startAngle: 0.9, // 0 - 2 factor of the radians
        endAngle: 2.1, // 0 - 2 factor of the radians
        min: 0,
        max: 100,
        shadow: {
            show: true,
            blur: 5
        },
        stroke: {
            color: "lightgray",
            width: 2
        }
    },
    label: {
        show: true,
        margin: "auto", // a specified number, or 'auto'
        background: {
            color: null,
            opacity: 0
        },
        font: {
            size: "auto", // a specified number, or 'auto'
            family: "sans-serif"
        },
        color: null,
        formatter: function(label, value) {
            return label;
        }
    },
    value: {
        show: true,
        margin: "auto", // a specified number, or 'auto'
        background: {
            color: null,
            opacity: 0
        },
        font: {
            size: "auto", // a specified number, or 'auto'
            family: "sans-serif"
        },
        color: null,
        formatter: function(label, value) {
            return parseInt(value);
        }
    },
    threshold: {
        show: true,
        width: "auto", // a specified number, or 'auto'
        label: {
            show: true,
            margin: "auto", // a specified number, or 'auto'
            background: {
                color: null,
                opacity: 0
            },
            font: {
                size: "auto", // a specified number, or 'auto'
                family: ",sans-serif"
            },
            color: null,
            formatter: function(value) {
                return value;
            }
        },
        values: [
            {
                value: 50,
                color: "lightgreen"
            }, {
                value: 80,
                color: "yellow"
            }, {
                value: 100,
                color: "red"
            },
        ]
    }
}
```

### Supported plugins
- grow
