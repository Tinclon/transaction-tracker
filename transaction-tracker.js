"use strict";

import chalk from 'chalk';
import { join } from "path";
import fs_extra from "fs-extra";
import csvtojson from "csvtojson";
const { readdirSync, lstatSync } = fs_extra;

const getFiles = srcpath => readdirSync(srcpath).filter(file => !lstatSync(join(srcpath, file)).isDirectory());

const categoryToVendorAndRulesMap = {
    "Airfare & Travel"                 : { p: 5, r: [/AIR TRANSAT.*/, /DELTA AIR.*/, /RC\* BOOKING\.COM/, /Taxis on Booking/, /WESTJET.*/] },
    "Arts/Exhibits/Theatre/Museum/Zoo" : { p: 5, r: [/DEVILS TOWER.*/, /.*CODY CAVE TOURS/, /CRAZY HORSE.*/, /SQ \*ESCAPE LEGENDS/, /FSY.*/, /Groupon, Inc./i, /NIAGARA PARKS COMMISSION/, /PN KOOTENAY WEST GATE NP/, /TIVOLI THEATRE/] },
    "Allowance"                        : { p: 1, r: [/.*TFR-TO [ALST]N(SAV|SPD|TTH)/], c: t => [2.13,2.35,2.77,3.04,3.20,3.77,4.14,5.79,6.37,9.59,10.58,12.47,13.68,14.40,16.97,18.63,26.06,28.67].some(amt => amt === Math.abs(t.amount)) },
    "Amusement Park/Skiing"            : { p: 5, r: [/RED MOUNTAIN RESORT/, /RED SPORTS/] },
    "Bank Fees & Charges"              : { p: 5, r: [/ANNUAL FEE/, /SEND E-TFR FEE/] },
    "Books & Supplies"                 : { p: 5, r: [/CARDSTONBOO.*/, /CRESTON VALLEY PUBLIC LIB/, /Deseret Book.*/, /Kindle.*/] },
    "Clothing"                         : { p: 5, r: [/CALL IT SPRING.*/, /CLEO.*/, /COSTCO WHS.*/, /CRESTON VALLEY GLEANERS S/, /Decathlon Canada.*/, /HM West Edmonton Mall/, /LDS DIST CANADA/, /LDS SPOKANE CENTER.*/, /LEGEND LOGOS/, /MARK'S STORE.*/, /MISSION THRIFT STORE.*/, /MOUNTAIN WAREHOUSE/, /NORDSTROM RACK.*/, /NORTH 40 OUTFITTERS.*/, /OLD NAVY.*/, /RICKI'S.*/, /SKECHERS.*/, /SP BLOOMCHIC/, /SP MANITOBAH MUKLUKS/, /TARGET.*/] },
    "Donations"                        : { p: 5, r: [/Ch JesusChrist   DON/], c: t=> Math.abs(t.amount) !== 400 },
    "Doctor/Dentist/Chiro/Optometrist" : { p: 5, r: [/DR. A.M. KAHANE DENTAL CL/, /.*KOOTENAY CHIROPRA/, /NISH DENTAL CLINIC/, /SUN LIFE.*/] },
    "Electronics & Software"           : { p: 5, r: [/Amazon Downloads.*/, /APPLE\.COM\/BILL/, /GOOGLE \*Google Storage/, /SOURCE.*/] },
    "Fast Food"                        : { p: 5, r: [/2LEVYATSPOKANE/, /A&W.*/, /ARBY'S.*/, /ARBYS.*/, /BOOSTER JUICE.*/, /CRANBROOK TRIPLE O.*/, /CREPEWORKS/, /DAIRY QUEEN.*/, /HARVEYS.*/, /KFC/, /KUNG PAO WOK/, /MCDONALD'S.*/, /MAMA PIZZA.*/, /NEW YORK FRIES.*/, /PANAGO.*/, /PIZZA PIZZA.*/, /.*STONE COLD ICE CREAM.*/, /Subway.*/, /TACO BELL.*/, /TACO TIME CANTINA.*/, /TIM HORTON'?S.*/, /.*WAREHOUSE PIZZA/, /WENDY'?S.*/] },
    "Fitness & Gym / Pool"             : { p: 5, r: [/AINSWORTH HOT SPRINGS.*/, /ARQ MOUNTAIN CENTRE/, /DISTRICT OF CENTRAL KOOTE/, /PADI CANADA/, /PADPADICLUB/] },
    "Gas & Fuel"                       : { p: 5, r: [/CBSA\/ASFC RYKERTS/, /CENTEX CRESTO.*/, /CHEVRON.*/, /CHV40149 CRANBROOK CHE/, /CONOCO.*/, /COSTCO GAS.*/, /.*ESSO.*/, /EXXON.*/, /HUSKY.*/, /MOBIL@.*/, /PETRO.?CAN.*/, /.*SAMUELS STORE/, /SHELL.*/, /.*WESTMOND/] },
    "Groceries"                        : { p: 5, r: [/7[- ]ELEVEN.*/, /COSTCO WHOLESAL.*/, /FARAMAN FARM/, /FRESHCO.*/, /.*MARAR ORCHARD.*/, /.*MACS CONV. STORES/, /MACS CONVENIENCE STORE.*/, /.*MAX'S PLACE/, /PAUL'S SUPERETTE/, /PEALOW'S YOUR INDEPEND.*/, /REAL (CDN|CANADIAN) SUPER.*/, /SAFEWAY.*/, /SAVE ON FOODS.*/, /THE GOLDEN FLOUR BAKER/, /WALGREENS.*/, /WLOKA FARMS FRUIT STAND.*/, /WYNNDEL FOODS/] },
    "Hobbies"                          : { p: 5, r: [/HOBBY-LOBBY.*/] },
    "Home"                             : { p: 5, r: [/APPLIANCE PARTS/, /CDN TIRE STORE.*/, /.*HOME HA.*/, /THE HOME DEPOT.*/] },
    "Insurance - Auto"                 : { p: 5, r: [/ICBC.*INS/] },
    "Insurance - Home"                 : { p: 5, r: [/TD Ins\/TD Assur.*INS/] },
    "Insurance - Travel"               : { p: 5, r: [/WESTERN FINANCIAL GROUP/] },
    "Hotel"                            : { p: 5, r: [/BAYMONT INN.*/, /COUNTRY INN & SUITES.*/, /EXPEDIA.*/, /FAIRBRIDGE INN & SUITES.*/, /HOLIDAY INN EXPRESS.*/, /Hotel at Booking.com/, /HYATT PLACE EDMONTON/, /MY PLACE HOTELS/, /RAMADA/, /SOUTHBRIDGE HOTEL.*/, /SUPER 8 MOTELS/, /VTG\*Moab Lodging Vacation/, /WESTWOOD INN & SUITES/] },
    "Income - Primary"                 : { p: 5, r: [/INTUIT CANADA U.*PAY/] },
    "Income - Secondary"               : { p: 5, r: [/KTUNAXA KINBASK.*PAY/] },
    "Income - Tertiary (Dividends)"    : { p: 5, r: [/.*TFR-FR [0-9]{7}/] },
    "Internet"                         : { p: 5, r: [/INTUIT CANADA.*AP/, /INTUIT CDA ULC.*BPY/, /TELUS PRE-AUTH PAYMENT/] },
    "Media & Entertainment"            : { p: 5, r: [/NETFLIX\.COM/] },
    "Mission"                          : { p: 5, r: [/Ch JesusChrist   DON/], c: t=> Math.abs(t.amount) === 400 },
    "Mobile Phone"                     : { p: 5, r: [/BELL MOBILITY.*/, /VIRGIN PLUS/] },
    "Mortgage & Rent"                  : { p: 5, r: [/INTEREST/, /LN PYMT.*[0-9]{9}/] },
    "Office Supplies"                  : { p: 5, r: [/CRESTON CARD & STATION/, /STAPLES STORE.*/] },
    "Pets"                             : { p: 5, r: [/HOUND N MOUSER.*/, /.*PET ADOPTION.*/, /PETLAND.*/, /PETSMART.*/, /PET VALU CANADA INC./, /.*VETERINARY.*/] },
    "Pets - Dog"                       : { p: 5, r: [/SEND E-TFR.*/], c: t => t.description.indexOf("SEND E-TFR ***Pt6") !== -1 && Math.abs(t.amount) === 600 },
    "Pets - Horse"                     : { p: 5, r: [/SEND E-TFR.*/, /TANGLEFOOT VETERINARY.*/, /TOP CROP GARDEN FARM PET/], c: t => t.description.indexOf("SEND") === -1 || [195,455,520,600].some(amt => amt === Math.abs(t.amount)) },
    "Parking"                          : { p: 5, r: [/CALGARY AIRPORT EXIT TOLL/, /CITY OF CRANBROOK-AIRPORT/, /.*PARKING.*/] },
    "Pharmacy"                         : { p: 5, r: [/CRESTON PHARMACY.*/, /SHOPPERS DRUG MART.*/] },
    "Postage & Shipping"               : { p: 5, r: [/CPC \/ SCP.*/, /FEDEX.*/, /JAKES LANDING LLC/, /UPS.*/] },
    "Registration & Licensing"         : { p: 5, r: [/ICBC.*/, /Prov of BC- Doc Authent/] },
    "Restaurants"                      : { p: 5, r: [/APPLEBEES.*/, /BOSTONS? PIZZA.*/, /CANYON COUNTRY STORE/, /CRACKER BARREL.*/i, /DENNY'S.*/, /ELLAS/, /I & J FUSION CUISINE/, /MARLINS FAMILY RESTAUR/, /MONGOLIAN BBQ/, /MONTANAS.*/, /OLIVE GARD.*/, /ROCKY RIVER GRILL/, /SMITTY'S FAMILY RESTAU/, /SWISS CHALET.*/, /.*The Mountain Barn/] },
    "Service, Parts, & Maintenance"    : { p: 5, r: [/ARROW MOUNTAIN CARWASH/, /HIGH CALIBER AUTO COLL.*/, /INTEGRA TIRE/, /LORDCO PARTS.*/, /NAPA ASSOCIATE.*/] },
    "Shopping"                         : { p: 5, r: [/Amazon\.ca.*/, /AMZN Mktp.*/, /APPLE.COM\/CA/, /.*BARGAIN SHOP.*/, /CRESTON 2ND HAND COLLECTI/, /CRICUT/, /DOLLAR TREE.*/, /DOLLARAMA.*/, /ETSY.*/i, /HORSEWORLD.*/, /MAWSON'S SPORTS/, /Microsoft\*Store/, /.*MODERN ALCHEMY.*/, /MORRIS FLOWERS/, /NAYAX CANADA INC MASTER/, /PAYPAL.*/, /SANTA AND ME/, /SHUTTERFLY, INC\./, /SP FUTUREMOTIONINC/, /SQ \*HONEY BEE ZEN APIARIE/, /STYLETIFY/, /WAL-MART.*/, /WEST ED MALL LOCKER.*/, /WISH\.COM/, /YOUR DOLLAR STORE.*/] },
    "Tax - Income"                     : { p: 5, r: [/TAX REFUND +RIT/] },
    "Tax - Property"                   : { p: 5, r: [] },
    "Transfer"                         : { p: 5, r: [/.*CASH WITHDRA.*/, /E-TRANSFER.*/, /LB151 TFR-TO C\/C/, /PREAUTHORIZED PAYMENT/, /REWARDS REDEMPTION/, /SEND E-TFR \*\*\*TCx/, /PAYMENT - THANK YOU/, /PYT FRM: 89673156554/, /TD VISA PREAUTH PYMT/, /.*TFR-TO [ALST]N(SAV|SPD|TTH)/, /.*TFR-TO 3156554/, /.*TFR-TO 6330246/, /.*TFR-TO 3325B7J/, /.*TFR-TO 3469F0J/, /.*TFR-TO 4131842/] },
    "Tuition"                          : { p: 5, r: [/EDUCATION.COM/, /IXL FAMILY SUB.*/, /IXL Learning/, /THE POTTERY OC/] },
    "Utilities"                        : { p: 5, r: [/FORTISBC.*/i] },
};
const customCategorization = t => {
    // Special cases
    if (t.description.indexOf("Ch JesusChrist   EXP") !== -1 && Math.abs(t.amount) === 428.26) { return "Groceries"; }                  // Reimbursement for groceries
    if (t.description.indexOf("Government of A  MSP") !== -1 && Math.abs(t.amount) === 388.93) { return "Shopping"; }                   // Reimbursement for foster shopping
    if (t.description.indexOf("APPLE.COM/BILL") !== -1 && Math.abs(t.amount) === 157.49) { return "Books & Supplies"; }                 // Duolingo
    if (t.description.indexOf("APPLE.COM/BILL") !== -1 && Math.abs(t.amount) === 131.23) { return "Media & Entertainment"; }            // Disney+
    if (t.description.indexOf("RCMP-CFP GRC-PCAF") !== -1 && Math.abs(t.amount) === 20.00) { return "Registration & Licensing"; }       // PAL
    if (t.description.indexOf("APPLE.COM/CA") !== -1 && Math.abs(t.amount) === 1152.98) { return "Shopping"; }                          // iPad
    if (t.description.indexOf("APPLE.COM/CA") !== -1 && Math.abs(t.amount) === 519.68) { return "Shopping"; }                           // iPad keyboard
    if (t.description.indexOf("Government of A  MSP") !== -1 && Math.abs(t.amount) === 259.85) { return "Shopping"; }                   // Reimbursement for foster carseat
    if (t.description.indexOf("Government of A  MSP") !== -1 && Math.abs(t.amount) === 1273.84) { return "Shopping"; }                  // Reimbursement for foster Christmas trip and cot
    if (t.description.indexOf("Government of A  MSP") !== -1 && Math.abs(t.amount) === 767.68) { return "Shopping"; }                   // Reimbursement for foster cultural
    if (t.description.indexOf("Ch JesusChrist   EXP") !== -1 && Math.abs(t.amount) === 519.45) { return "Shopping"; }                   // Reimbursement for RS stuff
    if (t.description.indexOf("HH094 TFR-FR 4131842") !== -1 && Math.abs(t.amount) === 5000.00) { return "Transfer"; }                  // Internal transfer
    if (t.description.indexOf("IY461 TFR-FR 4131842") !== -1 && Math.abs(t.amount) === 9000.00) { return "Transfer"; }                  // Internal transfer
    if (t.description.indexOf("SEND E-TFR ***QpR") !== -1 && Math.abs(t.amount) === 600.00) { return "Vehicle"; }                       // Motorcycle
    if (t.description.indexOf("SEND E-TFR ***Mfj") !== -1 && Math.abs(t.amount) === 3000.00) { return "Vehicle"; }                      // Motorcycle
    if (t.description.indexOf("ICBC #75965") !== -1 && Math.abs(t.amount) === 460.00) { return "Vehicle"; }                             // Motorcycle
    if (t.description.indexOf("IQ001 TFR-FR 4131842") !== -1 && Math.abs(t.amount) === 1000.00) { return "Transfer"; }                  // Internal transfer
    if (t.description.indexOf("Ch JesusChrist   EXP") !== -1 && Math.abs(t.amount) === 338.84) { return "Groceries"; }                  // Reimbursement for RS stuff
    if (t.description.indexOf("UJ300 TFR-FR 3156554") !== -1 && Math.abs(t.amount) === 1900.00) { return "Vehicle"; }                   // Motorcycle
    if (t.description.indexOf("GC 9079-DEPOSIT") !== -1 && Math.abs(t.amount) === 129090.54) { return "Transfer"; }                     // Internal transfer
    if (t.description.indexOf("Ch JesusChrist   EXP") !== -1 && Math.abs(t.amount) === 205.49) { return "Groceries"; }                  // Internal transfer
    if (t.description.indexOf("SEND E-TFR ***bJP") !== -1 && Math.abs(t.amount) === 30.00) { return "Clothing"; }                       // Clothing
    if (t.description.indexOf("Government of A  MSP") !== -1 && Math.abs(t.amount) === 55.98) { return "Shopping"; }                    // Reimbursement for foster something
    if (t.description.indexOf("IU252 TFR-TO 4025031") !== -1 && Math.abs(t.amount) === 1000.00) { return "Shopping"; }                  // Transfer
    if (t.description.indexOf("SEND E-TFR ***tev") !== -1 && Math.abs(t.amount) === 3000.00) { return "Pets - Horse"; }                 // Horse
    if (t.description.indexOf("SEND E-TFR ***bVr") !== -1 && Math.abs(t.amount) === 3000.00) { return "Pets - Horse"; }                 // Horse
    if (t.description.indexOf("SEND E-TFR ***BhX") !== -1 && Math.abs(t.amount) === 3000.00) { return "Pets - Horse"; }                 // Horse
    if (t.description.indexOf("SEND E-TFR ***Gay") !== -1 && Math.abs(t.amount) === 1000.00) { return "Pets - Horse"; }                 // Horse
    if (t.description.indexOf("RDCK-CRESTON LA   _F") !== -1 && Math.abs(t.amount) === 45.38) { return "Home"; }                        // Dump trip
    if (t.description.indexOf("SEND E-TFR \*\*\*nEH") !== -1 && Math.abs(t.amount) === 95.00) { return "Pets - Horse"; }                // Halter
    if (t.description.indexOf("TOWN OF CRESTON   _F") !== -1 && Math.abs(t.amount) === 105.00) { return "Pets - Dog"; }                 // Dog license
    if (t.description.indexOf("SEND E-TFR \*\*\*mfg") !== -1 && Math.abs(t.amount) === 200.00) { return "Registration & Licensing"; }   // Passport
    if (t.description.indexOf("ICBC #90895") !== -1 && Math.abs(t.amount) === 656) { return "Insurance - Auto"; }                       // Bike insurance

    return null;
};
const specialCategories = [/Allowance/, /Clothing/, /Doctor\/Dentist\/Chiro\/Optometrist/, /Gas & Fuel/, /Groceries/,
    /Insurance.*/, /Internet/, /Mobile Phone/, /Mortgage & Rent/, /Property Tax/, /Service & Parts/, /Tuition/, /Utilities/];

// Output helpers
const cp = c => c === "Uncategorized" ? chalk.red(c) : chalk.blue(c);                               // Category Print
const dp = d => chalk.yellow(d);                                                                    // Date Print
const np = n => n < 0 ? chalk.red(ra(nlp(n), 12)) : chalk.green(ra(nlp(n), 12));        // Number Print
const nlp = n => n.toLocaleString('en-CA', {minimumFractionDigits:2, maximumFractionDigits:2});     // Number Locale Print
const ra = (text, width) => " ".repeat(width - text.length) + text                            // Right Align
const output = categoryToAmountByYearMonthMap => {
    // Output data by yearMonth
    Object.keys(categoryToAmountByYearMonthMap).sort().forEach(yearMonth => {
        let specialCategoryAmounts = Array(specialCategories.length).fill(0);
        // Output the yearMonth header
        console.error(chalk.bold.yellow(`\n===============================================================================`));
        console.error(chalk.bold.yellow(`================================>   ${dp(yearMonth)}   <================================`));
        console.error(chalk.bold.yellow(`===============================================================================\n`));
        Object.keys(categoryToAmountByYearMonthMap[yearMonth]).sort().forEach(category => {
            //if (category === "Transfer") { return; }
            const pfix = specialCategories.some(sc => sc.test(category)) ? chalk.magenta("*") : "";
            // Replace special categories with their amounts
            let specialCategoryIndex = specialCategories.findIndex(sc => sc.test(category));
             specialCategoryAmounts[specialCategoryIndex++] += categoryToAmountByYearMonthMap[yearMonth][category].a;
            // Output the category header
            console.error(chalk.bold(`${np(categoryToAmountByYearMonthMap[yearMonth][category].a)} ${pfix}${cp(category)}${pfix}`));
            // Output the transactions
            categoryToAmountByYearMonthMap[yearMonth][category].t.sort().forEach(transaction => console.error(`\t\t${transaction}`));
        });
        console.error("\nSpecial Categories:" + chalk.bold(np(specialCategoryAmounts.reduce((a, b) => a + b, 0))));
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
            if (category === "Transfer") return;
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
        console.error(`\n\n`);
    });

    console.error(`\n\n`);
}

const process = transactions => {
    const categoryToAmountByYearMonthMap = {};
    Object.values(transactions).forEach(transaction => {
        const date = transaction.date.split("/");
        const isoDate = [date[2], date[0], date[1]].join("-");
        const yearMonth = [date[2], date[0]].join("-");

        transaction.amount = parseFloat(`${transaction.debit}` || `-${transaction.credit}`);

        const category = customCategorization(transaction)
            || (Object.entries(categoryToVendorAndRulesMap)
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

    output(categoryToAmountByYearMonthMap);
}

(() => {
    // Read in the current statements
    const transactions = {};
    const files = getFiles("./statements").filter(file => file.endsWith(".csv"));
    let parsedFiles = 0;

    // Parse and dedupe the transactions
    files.forEach(file =>
        csvtojson({noheader: true, headers: ["date", "description", "debit", "credit", "balance"]})
            .fromFile(`./statements/${file}`)
            .then(json => {
                json.forEach(transaction => transactions[`${transaction.date}${transaction.description}${transaction.debit}${transaction.credit}${transaction.balance}`] = transaction);
                // Process when we're done
                ++parsedFiles === files.length && process(transactions);
            })
    )
})();
