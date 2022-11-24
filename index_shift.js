const { PNG } = require('pngjs');
const pixelmatch = require('@rafal.szemraj/pixelmatch');
const glob = require('glob-promise');
const fs = require('fs-extra');

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

  for(const i of [1,2,3,4,5,6,7,8,9]) {


    for(const t of [0.01, 0.1, 0.2]) {

      for (const shift of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {

        await runPixelMatch(i, `diff_${t}`, {
          threshold: t,
          horizontalShiftPixels: 0,
          verticalShiftPixels: 0,
          includeAA: false,
        })
        await runPixelMatch(i, `diff_pm_${t}_${shift}x${shift}`, {
          threshold: t,
          horizontalShiftPixels: shift,
          verticalShiftPixels: shift,
          includeAA: true
        });

        console.log(`img set ${i}, threshold ${t}, shift: ${shift}x${shift} done...`)

      }
    }
  }
}


main().then(() => console.log('done.'));






