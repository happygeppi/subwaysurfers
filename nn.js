class NN {
  constructor(l) {
    this.layersn = l; // Anzahl Neuronen pro Layer
    this.L = this.layersn.length - 1; // index letzter Layer

    this.w = [[]]; // alle Gewichte
    this.b = [[]]; // alle Schwellenwerte
    this.a = []; // alle Aktivierungen der Neuronen
    this.output = []; // Aktivierung der letzten Schicht

    this.initialisieren();
  }

  initialisieren() {
    for (let l = 1; l <= this.L; l++) {
      // l: Ebenen
      let wl = [];
      let bl = [];

      for (let j = 0; j < this.layersn[l]; j++) {
        // j: w zu j hin bzw. bj
        let wlj = [];

        for (let k = 0; k < this.layersn[l - 1]; k++) {
          // k: w von k zu j
          let minw = -1;
          let maxw = 1;
          let wljk = Math.random() * (maxw - minw) + minw;

          wlj.push(wljk);
        }

        let minb = -1;
        let maxb = 1;
        let blj = Math.random() * (maxb - minb) + minb;

        wl.push(wlj);
        bl.push(blj);
      }

      this.w.push(wl);
      this.b.push(bl);
    }
  }

  feedforward(inp) {
    this.output = []; // output geleert
    this.a = []; // alle Neuronen geleert

    this.a.push(inp);

    for (let l = 1; l < this.layersn.length; l++) {
      // l: Ebenen (nur hidden & output)

      let as = [];
      for (let j = 0; j < this.layersn[l]; j++) {
        // j: Neuronen in l Ebene

        let w = this.w[l][j];
        let x = this.a[l - 1];
        let b = this.b[l][j];

        let z = b; // z = ... + b

        for (let n = 0; n < w.length; n++) {
          z += w[n] * x[n]; // z = wn*xn + ...
        }

        let a = 1 / (1 + Math.exp(-z));
        as.push(a);
      }

      this.a.push(as);
    }

    this.output = this.a[this.L];

    return this.output;
  }

  kopie() {
    let kop = new NN(this.layersn);
    
    for (let l = 1; l < this.layersn.length; l++) {
      for (let j = 0; j < this.layersn[l]; j++) {
        kop.b[l][j] = this.b[l][j];

        for (let k = 0; k < this.layersn[l-1]; k++) {
          kop.w[l][j][k] = this.w[l][j][k];
        }
      }
    }

    return kop;
  }

  mutiert(r) {
    let max = 5 * r;

    for (let l = 1; l < this.layersn.length; l++) {
      for (let j = 0; j < this.layersn[l]; j++) {
        if (Math.random() < r) {
          this.b[l][j] += Math.random() * 2 * max - max;
        }

        for (let k = 0; k < this.layersn[l - 1]; k++) {
          if (Math.random() < r) {
            this.w[l][j][k] += Math.random() * 2 * max - max;
          }
        }
      }
    }

    return this;
  }

  lost() {
    scores.push(this.score);
    this.mitdabei = false;
  }
}
