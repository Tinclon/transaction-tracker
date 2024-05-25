"use strict";

import chalk from 'chalk';
import { join } from "path";
import fs_extra from "fs-extra";
import csvtojson from "csvtojson";
const { readdirSync, lstatSync } = fs_extra;

import categoryToVendorAndRulesMap from "./categories/standard.js"
// Standard categories are of this form (Priority, Regex, Constraints for a Transaction):
// export default {
//     "Groceries"                        : { p: 5, r: [/COSTCO WHOLESAL.*/, /SAFEWAY.*/] },
//     "Internet"                         : { p: 5, r: [/INTERNET PAYMENT/], c: t => t.description.indexOf("Internet") !== -1 && Math.abs(t.amount) === 60 },
// };
import customCategorization from "./categories/custom.js"
// Custom categories are of this form:
// export default t => {
//     if (t.description.indexOf("some description") !== -1 && Math.abs(t.amount) === 24.56) { return "Groceries"; }
//     ...
// }
import specialCategories from "./categories/special.js"
// Special categories are of this form:
// export default [/Groceries/, /Internet/, ...];

const getFiles = srcpath => readdirSync(srcpath).filter(file => !lstatSync(join(srcpath, file)).isDirectory());

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
