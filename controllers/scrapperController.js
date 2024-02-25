const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    const wrapper = document.querySelector(".ussYcc");

    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 1000;
      const scrollDelay = 3000;

      const timer = setInterval(async () => {
        const scrollHeightBefore = wrapper.scrollHeight;
        wrapper.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeightBefore) {
          totalHeight = 0;
          await new Promise((resolve) => setTimeout(resolve, scrollDelay));

          // Calculate scrollHeight after waiting
          const scrollHeightAfter = wrapper.scrollHeight;

          if (scrollHeightAfter > scrollHeightBefore) {
            // More content loaded, keep scrolling
            return;
          } else {
            // No more content loaded, stop scrolling
            clearInterval(timer);
            resolve(null);
          }
        }
      }, 200);
    });
  });
};

exports.runScrapper = async (req, res) => {
  try {
    const url = req.body.url;

    puppeteerExtra.use(stealthPlugin());
    const browser = await puppeteerExtra.launch({
      headless: true,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();

    // let result = null;
    // let browser = null;

    try {
      //   browser = await chromium.puppeteer.launch({
      //     args: chromium.args,
      //     defaultViewport: chromium.defaultViewport,
      //     executablePath: await chromium.executablePath,
      //     headless: true,
      //     ignoreHTTPSErrors: true,
      //   });

      //   const page = await browser.newPage();

      await page.goto(url);

      await autoScroll(page);

      // Wait for the necessary elements to load
      await page.waitForSelector(".fHEb6e");

      const scrappedData = [];

      // Click on each 'button' tag
      let places = await page.$$(".fHEb6e");
      // Extracting list title
      const listTitleElement = await page.$(".IFMGgb");
      const listTitle = await page.evaluate(
        (element) => element.textContent,
        listTitleElement
      );

      console.log("List Title:", listTitle);

      for (let i = 0; i < places.length; i++) {
        places = await page.$$(".fHEb6e");

        // Click on the 'button' tag
        await places[i].click();

        // Wait for navigation to complete
        await page.waitForNavigation({ waitUntil: "networkidle0" });
        await page.waitForSelector(".lfPIob"); // Wait for 5 seconds
        const nameEl = await page.$(".lfPIob");
        const name = await page.evaluate(
          (element) => element.textContent,
          nameEl
        );
        const addressEl = await page.$(".kR99db");
        const address = await page.evaluate(
          (element) => element.textContent,
          addressEl
        );
        // const codeEl = await page.$('.AG25L:nth-child(9) .kR99db');
        // const code = await page.evaluate(element => element.textContent, codeEl);

        // Get the URL after clicking
        // const urlAfterClick = await page.url();
        scrappedData.push({
          name,
          address,
        });

        // Check if the back button is still available
        const backBtn = await page.$(".FeXq4d");
        if (backBtn) {
          await backBtn.click();
          // Wait for navigation to complete after going back
          await page.waitForNavigation({ waitUntil: "networkidle0" });
        } else {
          console.log("Back button not found.");
        }

        // Wait for the necessary elements to load again
        await page.waitForSelector(".fHEb6e"); // Wait for 5 seconds
      }

      const placeIds = [];

      // urls.forEach(async (url) => {
      for (let q = 0; q < scrappedData.length; q++) {
        const data = scrappedData[q];

        // Encode each component of the data
        const encodedName = encodeURIComponent(data.name);
        const encodedAddress = encodeURIComponent(data.address);

        try {
          const res = await axios.get(
            `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?inputtype=textquery&input=${encodedName},${encodedAddress}&key=${process.env.GOOGLE_API_KEY}`
          );
          placeIds.push(res?.data?.candidates?.[0]?.place_id);
        } catch (err) {
          console.log(err);
        }
      }

      // Close the browser
      await browser.close();
      console.log("Browser closed");

      console.log({ placeIds });
      res.status(200).json(placeIds);
    } catch (error) {
      console.log("Error during navigation:", error);
    }

    // Close the browser
    await browser.close();
    console.log("Browser closed");
  } catch (error) {
    console.log("Error during searchGoogleMaps:", error);
  }
};
