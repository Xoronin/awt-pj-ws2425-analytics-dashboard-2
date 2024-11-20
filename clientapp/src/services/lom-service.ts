import { XMLParser } from 'fast-xml-parser';

export interface LomData {
    general: {
        identifier: {
            entry: string;
        };
        title: {
            string: {
                _: string;
            };
        };
        description: {
            string: {
                _: string;
            };
        };
    };
    educational: {
        difficulty: {
            value: string;
        };
        interactivityType: {
            value: string;
        };
        learningResourceType: {
            value: string;
        };
        interactivityLevel: {
            value: string;
        };
        semanticDensity: {
            value: string;
        };
        typicalLearningTime: {
            duration: string;
        };
    };
    classification: {
        taxonPath: {
            taxon: {
                entry: {
                    string: {
                        _: string;
                    };
                };
            };
        };
    };
}

class LOMDataService {

    private apiUrl = 'http://localhost:5050/api';

    /**
     * Parses an XML string into a JavaScript object using `fast-xml-parser`.
     * @param xmlText - The XML string to be parsed.
     * @returns A parsed JavaScript object representing the XML structure.
     */
    parseXMLString(xmlText: string): any {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "value",
            parseAttributeValue: true,
            removeNSPrefix: true,
            parseTagValue: true,
            trimValues: true
        });
        return parser.parse(xmlText);
    }

    /**
     * Transforms a parsed XML object into a structured `LomData` object.
     * @param parsedXml - The parsed XML object.
     * @returns A `LomData` object or `null` if the XML structure is invalid.
     */
    transformToLomData(parsedXml: any): LomData | null {
        if (!parsedXml.lom) {
            console.warn('Invalid XML structure: missing lom root element');
            return null;
        }

        try {
            // Extract data with proper null checking
            const lomData: LomData = {
                general: {
                    identifier: {
                        entry: this.extractValue(parsedXml.lom, 'general.identifier.entry')
                    },
                    title: {
                        string: {
                            _: this.extractValue(parsedXml.lom, 'general.title.string.value')
                        }
                    },
                    description: {
                        string: {
                            _: this.extractValue(parsedXml.lom, 'general.description.string.value')
                        }
                    }
                },
                educational: {
                    difficulty: {
                        value: this.extractValue(parsedXml.lom, 'educational.difficulty.value') || 'medium'
                    },
                    interactivityType: {
                        value: this.extractValue(parsedXml.lom, 'educational.interactivityType.value')
                    },
                    learningResourceType: {
                        value: this.extractValue(parsedXml.lom, 'educational.learningResourceType.value')
                    },
                    interactivityLevel: {
                        value: this.extractValue(parsedXml.lom, 'educational.interactivityLevel.value')
                    },
                    semanticDensity: {
                        value: this.extractValue(parsedXml.lom, 'educational.semanticDensity.value')
                    },
                    typicalLearningTime: {
                        duration: this.extractValue(parsedXml.lom, 'educational.typicalLearningTime.duration')
                    }
                },
                classification: {
                    taxonPath: {
                        taxon: {
                            entry: {
                                string: {
                                    _: this.extractValue(parsedXml.lom, 'classification.taxonPath.taxon.entry.string.value')
                                }
                            }
                        }
                    }
                }
            };

            return lomData;
        } catch (error) {
            console.error('Error transforming XML:', error);
            return null;
        }
    }

    /**
     * Extracts a value from a nested object using a dot-separated path.
     * @param obj - The object to extract the value from.
     * @param path - The dot-separated path to the desired value.
     * @returns The extracted value or `null` if the path is invalid.
     */
    private extractValue(obj: any, path: string) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (!current[key]) return null;
            current = current[key];
        }

        // If the target is an object with nested "value", return its text
        if (current[0].value) {
            return current[0].value; 
        }
        return current._ || current;
    }

    /**
     * Stores LOM data in a MongoDB database after fetching and transforming XML metadata from URLs.
     * @returns A `Promise` that resolves when the data is stored successfully.
     * @throws An error if the data cannot be stored.
     */
    async storeLomDataInMongoDB(): Promise<void> {

        try {
            const manifestUrls = [
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/11.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/04.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/07.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/09.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/06.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/03.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/10.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/05.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/08.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/01.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/02.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/15.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/14.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/12.xml",
                "https://dash.fokus.fraunhofer.de/tests/tan/awt/ws2425/objectMetadata/13.xml"
            ];

            // First check if data already exists
            const existingdata = await this.getLomData();
            if (existingdata.length > 0) {
                console.log('lom data already exists in database');
                return;
            }

            // Fetch and transform data
            const responses = await Promise.all(
                manifestUrls.map(url =>
                    fetch(url)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.text();
                        })
                )
            );

            const lomDataArray = await Promise.all(
                responses.map(async xmlText => {
                    const parsedData = await this.parseXMLString(xmlText);
                    return this.transformToLomData(parsedData);
                })
            );

            // Store in MongoDB
            const response = await fetch(`${this.apiUrl}/lom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lomDataArray)
            });
            console.log(`Stored ${lomDataArray.length} LOM data documents in database`);

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
            }

            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error storing LOM data:', error);
            throw error;
        }
    }

    /**
     * Fetches LOM data from the MongoDB database.
     * @returns A `Promise` that resolves to an array of `LomData`.
     * @throws An error if the data cannot be retrieved.
     */
    async getLomData(): Promise<LomData[]> {
        try {
            const response = await fetch(`${this.apiUrl}/lom`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching LOM:', error);
            throw error;
        }
    }
}

export default LOMDataService