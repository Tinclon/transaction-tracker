"use strict";

import chalk from 'chalk';
import { join } from "path";
import fs_extra from "fs-extra";
import csvtojson from "csvtojson";
const { readdirSync, lstatSync } = fs_extra;

const getFiles = srcpath => readdirSync(srcpath).filter(file => !lstatSync(join(srcpath, file)).isDirectory());

const categoryToVendorAndRulesMap = {
    "Airfare"                          : { p: 5, r: [/AIR TRANSAT.*/] },
    "Arts/Exhibits/Theatre/Museum/Zoo" : { p: 5, r: [/DEVILS TOWER.*/, /.*CODY CAVE TOURS/, /CRAZY HORSE.*/, /Groupon, Inc./, /NIAGARA PARKS COMMISSION/, /PN KOOTENAY WEST GATE NP/, /TIVOLI THEATRE/] },
    "Allowance"                        : { p: 1, r: [/.*TFR-TO [ALST]N(SAV|SPD|TTH)/], c: t => [2.13,2.77,3.20,5.79,9.59,9.59,12.47,12.47,14.40,14.40,26.06,26.06].some(amt => amt === Math.abs(t.amount)) },
    "Amusement Park"                   : { p: 5, r: [] },
    "Bank Fees & Charges"              : { p: 5, r: [/SEND E-TFR FEE/] },
    "Books & Supplies"                 : { p: 5, r: [/CARDSTONBOO.*/] },
    "Clothing"                         : { p: 5, r: [/COSTCO WHSE.*/, /Decathlon Canada.*/, /LDS SPOKANE CENTER.*/, /LEGEND LOGOS/, /MARK'S STORE.*/, /NORTH 40 OUTFITTERS.*/, /TARGET.*/] },
    "Doctor/Dentist/Chiro/Optometrist" : { p: 5, r: [/.*KOOTENAY CHIROPRA/, /NISH DENTAL CLINIC/, /SUN LIFE.*/] },
    "Electronics & Software"           : { p: 5, r: [/Amazon Downloads.*/, /APPLE\.COM\/BILL/, /GOOGLE \*Google Storage/] },
    "Fast Food"                        : { p: 5, r: [/A&W.*/, /ARBY'S.*/, /BOOSTER JUICE.*/, /DAIRY QUEEN.*/, /HARVEYS.*/, /MCDONALD'S.*/, /KFC/, /PANAGO.*/, /PIZZA PIZZA.*/, /.*STONE COLD ICE CREAM.*/, /Subway.*/, /TACO BELL.*/, /TACO TIME CANTINA.*/, /TIM HORTON'?S.*/, /.*WAREHOUSE PIZZA/, /WENDY'?S.*/] },
    "Fitness & Gym / Pool"             : { p: 5, r: [/AINSWORTH HOT SPRINGS.*/, /ARQ MOUNTAIN CENTRE/] },
    "Gas & Fuel"                       : { p: 5, r: [/CBSA\/ASFC RYKERTS/, /CHEVRON.*/, /CHV40149 CRANBROOK CHE/, /CONOCO.*/, /.*ESSO.*/, /EXXON.*/, /HUSKY.*/, /MOBIL@.*/, /PETRO.?CAN.*/, /SHELL.*/, /.*WESTMOND/] },
    "Groceries"                        : { p: 5, r: [/7[- ]ELEVEN.*/, /FARAMAN FARM/, /.*MARAR ORCHARD.*/, /.*MAX'S PLACE/, /PAUL'S SUPERETTE/, /PEALOW'S YOUR INDEPEND.*/, /REAL (CDN|CANADIAN) SUPER.*/, /SAFEWAY.*/, /SAVE ON FOODS.*/, /WALGREENS.*/, /WLOKA FARMS FRUIT STAND.*/, /WYNNDEL FOODS/] },
    "Hobbies"                          : { p: 5, r: [] },
    "Home"                             : { p: 5, r: [/CDN TIRE STORE.*/, /.*HOME HARDWARE.*/] },
    "Insurance - Auto"                 : { p: 5, r: [/ICBC.*INS/] },
    "Insurance - Home"                 : { p: 5, r: [/TD Ins\/TD Assur.*INS/] },
    "Insurance - Travel"               : { p: 5, r: [/WESTERN FINANCIAL GROUP/] },
    "Horse"                            : { p: 5, r: [/SEND E-TFR.*/, /TANGLEFOOT VETERINARY.*/], c: t => t.description.indexOf("SEND") === -1 || Math.abs(t.amount) === 520 },
    "Hotel"                            : { p: 5, r: [/BAYMONT INN.*/, /COUNTRY INN & SUITES.*/, /FAIRBRIDGE INN & SUITES.*/, /HOLIDAY INN EXPRESS.*/, /MY PLACE HOTELS/, /RAMADA/, /SOUTHBRIDGE HOTEL.*/, /WESTWOOD INN & SUITES/] },
    "Income - Primary"                 : { p: 5, r: [/INTUIT CANADA U.*PAY/] },
    "Income - Secondary"               : { p: 5, r: [/KTUNAXA KINBASK.*PAY/] },
    "Income - Tertiary (Dividends)"    : { p: 5, r: [/.*TFR-FR [0-9]{7}/] },
    "Internet"                         : { p: 5, r: [/INTUIT CANADA.*AP/, /TELUS PRE-AUTH PAYMENT/] },
    "Media & Entertainment"            : { p: 5, r: [/NETFLIX\.COM/] },
    "Mobile Phone"                     : { p: 5, r: [/BELL MOBILITY.*/, /VIRGIN PLUS/] },
    "Mortgage & Rent"                  : { p: 5, r: [/INTEREST/, /LN PYMT.*[0-9]{9}/] },
    "Office Supplies"                  : { p: 5, r: [/CRESTON CARD & STATION/, /STAPLES STORE.*/] },
    "Pets"                             : { p: 5, r: [/HOUND N MOUSER.*/, /.*PET ADOPTION.*/, /PETLAND.*/, /PETSMART.*/, /.*VETERINARY.*/] },
    "Parking"                          : { p: 5, r: [/CALGARY AIRPORT EXIT TOLL/, /.*PARKING.*/] },
    "Pharmacy"                         : { p: 5, r: [/SHOPPERS DRUG MART.*/] },
    "Postage & Shipping"               : { p: 5, r: [/CPC \/ SCP.*/, /JAKES LANDING LLC/] },
    "Registration & Licensing"         : { p: 5, r: [/ICBC.*/] },
    "Restaurants"                      : { p: 5, r: [/APPLEBEES.*/, /BOSTONS? PIZZA.*/, /DENNY'S.*/, /MARLINS FAMILY RESTAUR/, /OLIVE GARD.*/, /ROCKY RIVER GRILL/, /SWISS CHALET.*/] },
    "Service & Parts"                  : { p: 5, r: [/HIGH CALIBER AUTO COLL.*/, /INTEGRA TIRE/, /LORDCO PARTS.*/, /NAPA ASSOCIATE.*/] },
    "Shopping"                         : { p: 5, r: [/Amazon\.ca.*/, /AMZN Mktp.*/, /.*BARGAIN SHOP.*/, /CRICUT/, /DOLLAR TREE.*/, /ETSY/, /MORRIS FLOWERS/, /SP FUTUREMOTIONINC/, /WISH\.COM/, /.*MODERN ALCHEMY.*/, /WAL-MART.*/, /YOUR DOLLAR STORE.*/] },
    "Transfer"                         : { p: 5, r: [/.*CASH WITHDRA.*/, /PREAUTHORIZED PAYMENT/, /REWARDS REDEMPTION/, /TD VISA PREAUTH PYMT/, /.*TFR-TO [ALST]N(SAV|SPD|TTH)/] },
    "Tuition"                          : { p: 5, r: [/IXL FAMILY SUB.*/] },
    "Utilities"                        : { p: 5, r: [/FORTISBC.*/i] },
};
const specialCategories = [/Allowance/, /Clothing/, /Doctor\/Dentist\/Chiro\/Optometrist/, /Gas & Fuel/, /Groceries/,
    /Insurance.*/, /Internet/, /Mobile Phone/, /Mortgage & Rent/, /Property Tax/, /Service & Parts/, /Tuition/, /Utilities/];

(() => {
    // Output helpers
    const cp = c => c === "Uncategorized" ? chalk.red(c) : chalk.blue(c);                               // Category Print
    const dp = d => chalk.yellow(d);                                                                    // Date Print
    const np = n => n < 0 ? chalk.red(ra(nlp(n), 12)) : chalk.green(ra(nlp(n), 12));        // Number Print
    const nlp = n => n.toLocaleString('en-CA', {minimumFractionDigits:2, maximumFractionDigits:2});     // Number Locale Print
    const ra = (text, width) => " ".repeat(width - text.length) + text                            // Right Align
    const output = () => {
        // Output data by yearMonth
        Object.keys(categoryToAmountByYearMonthMap).sort().forEach(yearMonth => {
            let specialCategoryAmounts = Array(specialCategories.length).fill(0);
            // Output the yearMonth header
            console.error(chalk.bold.yellow(`\n===============================================================================`));
            console.error(chalk.bold.yellow(`================================>   ${dp(yearMonth)}   <================================`));
            console.error(chalk.bold.yellow(`===============================================================================\n`));
            Object.keys(categoryToAmountByYearMonthMap[yearMonth]).sort().forEach(category => {
                if (category === "Transfer") { return; }
                const pfix = specialCategories.some(sc => sc.test(category)) ? chalk.magenta("*") : "";
                // Replace special categories with their amounts
                let specialCategoryIndex = specialCategories.findIndex(sc => sc.test(category));
                 specialCategoryAmounts[specialCategoryIndex++] += categoryToAmountByYearMonthMap[yearMonth][category].a;
                // Output the category header
                console.error(chalk.bold(`${np(categoryToAmountByYearMonthMap[yearMonth][category].a)} ${pfix}${cp(category)}${pfix}`));
                // Output the transactions
                categoryToAmountByYearMonthMap[yearMonth][category].t.sort().forEach(transaction => console.error(`\t\t${transaction}`));
            });
            console.error("\nSpecial Categories");
            console.error(specialCategoryAmounts.map(sca => np(sca)).join("\t"));
        });

        // Output summary
        console.error(chalk.bold.green(`\n===============================================================================`));
        console.error(chalk.bold.green(`================================>   SUMMARY   <================================`));
        console.error(chalk.bold.green(`===============================================================================\n`));
        console.error(chalk.bold(chalk.green(`\t      Income`) + chalk.red(`\t     Expense`) + chalk.grey(`\t\t Net\n`)));

        // Collect totals by yearMonth and by year
        const totalsByYear = {};
        Object.keys(categoryToAmountByYearMonthMap).forEach(yearMonth => {
            const year = yearMonth.split("-")[0];
            let totalDebit = 0; let totalCredit = 0;
            // Collect totals by yearMonth
            Object.keys(categoryToAmountByYearMonthMap[yearMonth]).forEach(category => {
                categoryToAmountByYearMonthMap[yearMonth][category].a < 0 && (totalDebit += -1 * categoryToAmountByYearMonthMap[yearMonth][category].a);
                categoryToAmountByYearMonthMap[yearMonth][category].a > 0 && (totalCredit += -1 * categoryToAmountByYearMonthMap[yearMonth][category].a);
            });

            // Collect totals by year
            totalsByYear[year] = totalsByYear[year] || {d: 0, c: 0, ym: {}};
            totalsByYear[year].ym[yearMonth] = {d: totalDebit, c: totalCredit};
            totalsByYear[year].d += totalDebit; totalsByYear[year].c += totalCredit;
        });

        // Output yearly summaries
        Object.keys(totalsByYear).sort().forEach(year => {
            Object.keys(totalsByYear[year].ym).sort().forEach(yearMonth =>
                // Output Income, Expense, Net for each yearMonth
                console.error(`${dp(yearMonth)}\t${np(totalsByYear[year].ym[yearMonth].d)}\t${np(totalsByYear[year].ym[yearMonth].c)}\t`
                    + chalk.bold(`${np(totalsByYear[year].ym[yearMonth].d + totalsByYear[year].ym[yearMonth].c)}`)));
            // Output Income, Expense, Net for each year
            console.error(chalk.yellow.bold(`\n   ${year}`)+`\t${np(totalsByYear[year].d)}\t${np(totalsByYear[year].c)}\t${np(totalsByYear[year].d + totalsByYear[year].c)}`);
        });

        console.error(`\n\n`);
    }

    const categoryToAmountByYearMonthMap = {};

    // Read in the current statements
    const files = getFiles("./statements");
    let parsedFiles = 0;

    // Parse and classify
    files.forEach(file =>
        csvtojson({noheader: true, headers: ["date", "description", "debit", "credit", "balance"]})
            .fromFile(`./statements/${file}`)
            .then(transactions => {
                transactions.forEach(transaction => {
                    const date = transaction.date.split("/");
                    const isoDate = [date[2], date[0], date[1]].join("-");
                    const yearMonth = [date[2], date[0]].join("-");

                    transaction.amount = parseFloat(`${transaction.debit}` || `-${transaction.credit}`);

                    const category = (Object.entries(categoryToVendorAndRulesMap)
                        // Sort by priority, lower goes first
                        .sort((c2vrm1, c2vrm2) => c2vrm1[1].p - c2vrm2[1].p)
                        .find(([, {r, c: constraint}]) =>
                            // Matches at least one of the regexes in the list and passes the custom filter if one exists
                            r.some(regex => regex.test(transaction.description)) && (!constraint || constraint(transaction)))
                        || ["Uncategorized"])[0];

                    // Create objects and set defaults if they don't exist
                    categoryToAmountByYearMonthMap[yearMonth] = categoryToAmountByYearMonthMap[yearMonth] || {};
                    categoryToAmountByYearMonthMap[yearMonth][category] = categoryToAmountByYearMonthMap[yearMonth][category] || {a: 0, t: []};

                    // Add the transaction to the category
                    categoryToAmountByYearMonthMap[yearMonth][category].a += transaction.amount;
                    categoryToAmountByYearMonthMap[yearMonth][category].t.push(`${dp(isoDate)}${np(transaction.amount)}\t${transaction.description}`);
                });

                // Output if we're done
                ++parsedFiles === files.length && output();
            })
    )
})();
