# BCI control application

This is a working prototype of a BCI control application. It uses two motor imagery commands (left and right hand) and one muscular command (blink) to move around the interface and execute actions.

In this first version, a single machine-learning model, based on Riemannian geometry, is computed after a short calibration session. The interface is a grid, where each cell is associated with a given action. The number of cells is arbitrary. At the beginning, the center cell is highlighted. The user can move to the left or right cell by mentally clenching is left or right fist. A single blink changes the orientation: the left fist now allows to move one cell down, and the right fist one cell up. One can blink again to revert to the original disposition. A double blink executes the action of the currently selected cell. A triple blink toggles the interface, to avoid the unintentional classification of EEG epochs.

See the video for a full walkthrough of the interface.

## Installation

First, install Timeflux in a clean environment:

```
$ conda create --name timeflux python=3.10
$ conda activate timeflux
```

Then, install the app from the Git repository:

```
$ git clone https://github.com/inclusive-brains/control.git
$ cd control
$ pip install -r requirements.txt
```

## Updating

Get the latest code from the repository:

```
$ cd control
$ git pull
```

## Running

Do not forget to activate your environment before executing the following:

```
$ timeflux -d app.yaml
```

Then go to the [monitoring](http://localhost:8000/monitor/) interface or start a new [BCI session](http://localhost:8000/app/).

## Configuration

Currently, the configuration happens directly in the `app.yaml` file (the Timeflux application graph). In a future version, a dedicated configuration file will be available.

### Devices

This application is device-agnostic, as long as the EEG system provides enough quality data and a sensible electrode montage. It is possible to select the desired device from the `import` section. Each sub-graph must provide its own preprocessing pipeline (filtering, channel selection, etc.)

A random data graph is also available in order to test the interface without an actual EEG system.

### Recording

The raw EEG data and calibration events can be recorded in the HDF5 file format in the `data` directory. To enable this feature, uncomment the corresponding line in the `import` section.

### General configuration

The training parameters and grid interface can be configured in the `app` node of the `UI` graph:

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| training.blocks_per_session | number | number of blocks per session | 3 |
| training.instructions_per_block | number | number of instructions per block | 10 |
| training.duration.prep | number | preparation duration before session starts, in ms | 5000 |
| training.duration.rest | number | rest duration between blocks, in ms | 10000 |
| training.duration.on | number | duration of the instruction message, in ms | 3000 |
| training.duration.off | number | blank screen duration after each instruction, in ms | 2000 |
| training.instructions | string[] | list of instructions | ['Clench your LEFT fist', 'Clench your RIGHT fist', 'BLINK once'] |
| grid.symbols | string | symbols, one character per cell | ‘123456789’ |
| grid.shape.columns | number | number of columns in the grid (the number of rows will be adjusted automatically) | 3 |
| grid.shape.ratio | string | grid aspect ratio (examples: '1:1', '16:9'), an empty string means 100% width and 100% height | '' |
| grid.shape.borders | boolean | if the borders must be drawn | true |
| grid.shape.wrap | boolean | if the selection must warp around | false |

### Accumulation of probabilities

The signal is continuously windowed into 800 ms epochs with a 10 ms step. Each epoch is sent to the  machine-learning model, which outputs the probabilities for each of the three classes. These probabilities are then accumulated to a buffer, and when enough confidence is reached for a specific class, the final prediction is made and sent to the user interface. Confidence is defined by the threshold ratio between the two best candidates, after summing the probabilities for each class.

This method is inspired by this [paper](https://arxiv.org/abs/2203.07807) and previous work on a [P300 speller](https://github.com/timeflux/demos/tree/main/speller/P300).

Fine-tuning the following parameters (in the `predict` node of the `Classification` graph) allows to strike a balance between the calibration and prediction durations:

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| threshold | float | ratio between the two best candidates to reach confidence | 2 |
| buffer_size | integer | number of predictions to accumulate for each class | 10 |

## Blinks

The model only classify single blinks. The UI is responsible for detecting double and triple blinks. It applies the following heuristic: the time between two consecutive blink events must be less than 300 ms (to not take into account unrelated blinks) and more than 50 ms (to not classify the same blink twice).

## Cheating ;)

For testing or demo purposes, when an EEG headset is not readily available, keyboard shortcuts are provided.

| Key | Command | Action |
| --- | --- | --- |
| ArrowRight | right hand | right/up |
| ArrowLeft | left hand | left/down |
| w | single blink | flip |
| x | double blink | execute |
| c | triple blink | toggle |
| 0 | right hand | right/up |
| 1 | left hand | left/down |
| 2 | blink | flip/execute/toggle |

## Application schema

This is the full application graph. Click to zoom in.

![Application schema](app.png)
