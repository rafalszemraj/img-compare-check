const { compare } = require('odiff-bin');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const glob = require('glob-promise');
const fs = require('fs-extra');

const runOdiffMatch = async (i, diff, options) => {
  const startTime = new Date()
  const { match, reason, diffCount, diffPercentage } = await compare(
    `images/${i}/master.png`,
    `images/${i}/branch.png`,
    `images/${i}/${diff}.png`,
    { ...options, antialiasing: true }
  );


  return match ? { match: true } : {
    match,
    diffCount,
    diffPercentage: Math.ceil((diffPercentage ?? 0) * 100) / 100,
    threshold: options.threshold,
    executionTime: new Date() - startTime,
  }

}

const runPixelMatch = async (i, diff, options) => {

  const startTime = new Date()
  const img1 = PNG.sync.read(fs.readFileSync(`images/${i}/master.png`));
  const img2 = PNG.sync.read(fs.readFileSync(`images/${i}/branch.png`));
  const {width, height} = img1;
  const diffImg = new PNG({width, height});

  const differentPixels = await  pixelmatch(img1.data, img2.data, diffImg.data, width, height, options);

  const diffPercentage = (differentPixels / width / height) * 100
  if(differentPixels ) {
    fs.writeFileSync(`images/${i}/${diff}.png`, PNG.sync.write(diffImg));
    return {
      match: differentPixels === 0,
      diffCount: differentPixels,
      diffPercentage:  Math.ceil(diffPercentage * 100)/100,
      threshold: options.threshold,
      executionTime: new Date() - startTime,
    }
  }
  return { match: true }

}


async function main() {

  const files = await glob("images/**/diff*.*")
  for(const file of files) {

    await fs.remove(file)

  }

  const output = []
  for(const i of [1,2,3,4,5,6,7,8,9]) {

    const set = {
      set: i,
      runs: []
    }

    for(const t of [.1,.2,.3,.4,.5,.6,.7,.8,.9]) {

      const odiff_result = await runOdiffMatch(i, `diff_odiff_${t}`, {threshold: t});
      const pixelmatch_result = await runPixelMatch(i, `diff_pm_${t}`, {threshold: t});

      if(!odiff_result.match && !pixelmatch_result.match) {

        set.runs.push({
          threshold: t,
          odiff: odiff_result,
          pixelmatch: pixelmatch_result,
        })
      }

      console.log(`img set ${i}, threshold ${t} done...`)

    }

    output.push(set)
  }
    fs.writeJsonSync("out.json", output)

}


main().then(() => console.log('done.'));






