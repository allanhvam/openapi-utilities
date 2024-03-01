#! /usr/bin/env node

import { program } from '@commander-js/extra-typings';
import SwaggerParser from "@apidevtools/swagger-parser";
import { stringify } from "yaml";
import { writeFileSync } from "node:fs";
import type { OpenAPIV3 } from "openapi-types";

program.name('openapi-utilities')
    .version('0.1.0');

program
    .argument('<input>')
    .description("path/url to OpenAPI/Swagger document as json/yaml")
    .option("-o, --output <path>", "output path", "ApiSpecification.yaml")
    .option('--fix-additional-properties', "sets additionalProperties to false if undefined", false)
    .option('--fix-nullable-required', "remove nullable from properties, but set as required", false)
    .action(async (input, options) => {
        console.log("Get OpenAPI document from", input);
        const openApiDocument = await SwaggerParser.bundle(input);

        // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md
        // additionalProperties - Value can be boolean or object. Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema. Consistent with JSON Schema, additionalProperties defaults to true.
        if (options.fixAdditionalProperties &&
            "components" in openApiDocument &&
            openApiDocument.components?.schemas) {
            const schemas = openApiDocument.components.schemas;
            const schemasKeys = Object.keys(schemas);
            for (let s = 0; s !== schemasKeys.length; s++) {
                const schema = schemas[schemasKeys[s]];

                // Check for ReferenceObject
                if ("$ref" in schema) {
                    continue;
                }

                if (schema.additionalProperties === undefined) {
                    schema.additionalProperties = false;
                }
            }
        }

        if (options.fixNullableRequired &&
            "components" in openApiDocument &&
            "openapi" in openApiDocument &&
            openApiDocument.components?.schemas) {

            const version = openApiDocument.openapi;
            if (version.indexOf("3.0") === 0) {
                const v3 = openApiDocument as OpenAPIV3.Document<{}>;

                const schemas = v3.components!.schemas;
                const schemasKeys = Object.keys(schemas!);
                for (let s = 0; s !== schemasKeys.length; s++) {
                    const schema = schemas![schemasKeys[s]];

                    // Check for ReferenceObject
                    if ("$ref" in schema) {
                        continue;
                    }

                    if (schema.properties && schema.required === undefined) {
                        const required = new Array<string>();
                        const propertyKeys = Object.keys(schema.properties);
                        for (let p = 0; p !== propertyKeys.length; p++) {
                            const propertyKey = propertyKeys[p];
                            const property = schema.properties[propertyKey];

                            if ("$ref" in property || property.type === "array") {
                                required.push(propertyKey);
                                continue;
                            }

                            if (property.nullable) {
                                delete property.nullable;
                            } else {
                                required.push(propertyKey);
                            }
                        }
                        schema.required = required;
                    }
                }
            }
        }

        // Write
        const yaml = stringify(openApiDocument, { indent: 2 });
        writeFileSync(options.output, yaml);
    });

program.parse();
