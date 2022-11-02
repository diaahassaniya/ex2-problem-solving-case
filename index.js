const readline = require("readline");
const xlsx = require("node-xlsx");
const fs = require("fs");

/**
 *
 * @param {string} fileName
 * @param {Madata} data
 * @param {number} type 1 or 2
 * @param {number} numberOfProduct
 */

const writeToFile = (fileName, data, type, numberOfProduct) => {
  try {
    const file = fs.createWriteStream(fileName);
    file.on("error", function (err) {
      throw err;
    });
    data.forEach((order, key) => {
      if (type === 1) {
        file.write(key + "," + order.quantity / numberOfProduct + "\n");
      } else {
        file.write(order.productName + "," + order.brand + "\n");
      }
    });
    console.log(`Check the result in ${fileName}`);
    file.end();
  } catch (error) {
    console.log("error while writing the file ", error);
  }
};

/**
 * @param {Map} pubularProudctNames
 */

const sortAndGetTheHiestValues = (pubularProudctNames) => {
  try {
    let highestValueFromEachBrand = [];
    //get the highest ValueFromEachBrand
    pubularProudctNames.forEach((val, key) => {
      brand = Object.keys(val.brands).reduce((a, b) =>
        val.brands[a] > val.brands[b] ? a : b
      );
      highestValueFromEachBrand.push({
        productName: key,
        brand,
        value: val.brands[brand],
      });
    });

    highestValueFromEachBrand.sort((a, b) => {
      return b.value - a.value;
    });

    return highestValueFromEachBrand;
  } catch (error) {
    console.log("Error in sortAndGetTheHiestValues", error);
  }
};

try {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  console.log("Enter the file name:");

  //reading the file name that need to be handeld
  rl.on("line", (line) => {
    //main file represtes the orders is input_example.csv
    if (!line.includes(".csv")) {
      console.log("Please enter valid file with the extension of .csv");
      return;
    }
    let obj = xlsx.parse(__dirname + `/${line}`);
    const numberOfProduct = obj[0].data.length;
    let products = [];

    if (numberOfProduct <= 1) {
      console.log("The file is empty");
      return;
    } else if (numberOfProduct >= 10000) {
      console.log("The file is too big");
    }

    //get each key with its value
    obj[0].data.map((order) => {
      //hadnel empty lines
      if (order[0]) {
        let product = order[0].split(",");
        let productName = product[2];
        let quantity = parseInt(product[3]);
        let brand = product[4];
        let newOrder = { productName, quantity, brand };
        products.push(newOrder);
      }
    });

    const productSet = new Map();
    const pubularProudctName = new Map();

    for (let i = 0; i < numberOfProduct; i++) {
      const product = products[i];
      const productName = product.productName;
      const ProductQuantity = product.quantity;
      const brand = product.brand;

      //register product names for the first time
      //First File 0_order_log00.csv
      if (!productSet.has(productName)) {
        productSet.set(`${productName}`, {
          quantity: ProductQuantity,
          numOfOccurance: 1,
        });

        //secound File 1_order_log00.csv
        pubularProudctName.set(`${productName}`, {
          brands: { [brand]: 1 },
        });
      } else {
        //handling the existed product name for file one
        let productData = productSet.get(productName);
        productSet.set(productName, {
          ...productData,
          quantity: productData.quantity + ProductQuantity,
          numOfOccurance: productData.numOfOccurance + 1,
        });

        //handling the existed product name for file two
        let pubularProudctData = pubularProudctName.get(productName);
        if (pubularProudctData.brands[brand]) {
          let numOfOrdersForTheBrand = pubularProudctData.brands[brand];

          pubularProudctName.set(`${productName}`, {
            brands: {
              ...pubularProudctData.brands,
              [brand]: numOfOrdersForTheBrand + 1,
            },
          });
        } else {
          pubularProudctName.set(`${productName}`, {
            brands: { ...pubularProudctData.brands, [brand]: 1 },
          });
        }
      }
    }

    let highestValueFromEachBrand =
      sortAndGetTheHiestValues(pubularProudctName);

    //writing the result to the files
    writeToFile("0_order_log00.csv", productSet, 1, numberOfProduct);
    writeToFile("1_order_log00.csv", highestValueFromEachBrand, 2);
  });

  rl.once("close", (s) => {
    console.log("s", s);
    // end of input
  });
} catch (error) {
  console.log("error");
}

process.on("uncaughtException", (error, promise) => {
  console.error(
    `Unhandled Rejection at\n ${promise}\n error: ${error}\n will shutdown process.`
  );
  process.exit(1);
});
