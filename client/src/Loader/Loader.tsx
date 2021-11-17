import { useLazyQuery } from "@apollo/client";

import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { exportCSVFile } from "./csv"; 

const GET_CARDS = gql`
  query GetCards($first: Int!, $offset: Int!) {
    cards(first: $first, offset: $offset) {
      edges {
        node {
          id
          cardId
          importId
          json
          #   nation {
          #     id
          #     key
          #     shortName
          #     name
          #     hq
          #     hqImage
          #     allyOnly
          #   }
          image
          resources
        }
      }
      pageInfo {
        count
        hasNextPage
      }
    }
  }
`;

type CardMeta = {
  id: number;
  cardId: string;
  importId: string;
  json: Card;
  image: string;
  resources: number;
};

type Card = {
  id: string;
  set: string;
  text: { [key: string]: string };
  type: string;
  image: string;
  title: { [key: string]: string };
  attack: number;
  rarity: string;
  defense: number;
  faction: string;
  kredits: number;
  import_id: string;
  attributes: { [key: string]: string };
};

const Loader = () => {
  const [cards, setCards]: any = useState([]);
  const [getMoreCards, { loading, error, data }] = useLazyQuery(GET_CARDS);
  const first: number = 1000000;

  useEffect(() => {
    console.log("change data", data?.cards?.edges);
    if (data?.cards?.edges) {
      setCards((c: Card[]) => [...c, ...data.cards.edges]);
    }
  }, [data]);

  const handleLoadMore = (e: any) => {
    e.preventDefault();
    console.log("first", first, "offset", cards.length);
    getMoreCards({
      variables: { first, offset: cards.length },
    });
  };

  const generateCSV = (e: any) => {
    e.preventDefault();
    console.log("generateCSV", cards);

    const textLanguageSet = new Set();
    const titleLanguageSet = new Set();
    const attributesSet = new Set();

    cards.forEach((card) => {
      const data = card?.node?.json;
      if (data) {
        if (data.text) {
          Object.keys(data.text).forEach((key) => {
            textLanguageSet.add(key);
          });
        }

        if (data.title) {
          Object.keys(data.title).forEach((key) => {
            titleLanguageSet.add(key);
          });
        }
        if (data.attributes) {
          data.attributes.forEach((attribute) => {
            attributesSet.add(attribute);
          });
        }
      }
    });

    let headers = {};

    titleLanguageSet.forEach((title: string) => {
      headers[`title ${title}`] = `title ${title}`;
    });
    textLanguageSet.forEach((text: string) => {
      headers[`text ${text}`] = `text ${text}`;
    });

    headers = {
      ...headers,
      ...{
        id: "id",
        set: "set",
        type: "type",
        attack: "attack",
        rarity: "rarity",
        defense: "defense",
        faction: "faction",
        kredits: "kredits",
      },
    };

    attributesSet.forEach((attribute: string) => {
      headers[attribute] = attribute;
    });
    titleLanguageSet.forEach((title: string) => {
      headers[`image ${title}`] = `image ${title}`;
    });
    const itemsFormatted = [];
    cards.forEach((card) => {
      const data = card?.node?.json;
      const image = card?.node?.image;
      let obj = {};
      titleLanguageSet.forEach((title: string) => {
        obj[`title ${title}`] = data.title[title]
          ? data.title[title].replace(/;/g, " ")
          : "";
      });
      textLanguageSet.forEach((text: string) => {
        obj[`text ${text}`] = data.text[text]
          ? data.text[text].replace(/;/g, " ")
          : "";
      });
      obj = {
        ...obj,
        ...{
          id: data.id,
          set: data.set,
          type: data.type,
          attack: data.attack == null ? "" : data.attack,
          rarity: data.rarity,
          defense: data.defense == null ? "" : data.defense,
          faction: data.faction,
          kredits: data.kredits,
        },
      };
      attributesSet.forEach((attribute: string) => {
        obj[attribute] =
          data.attributes && data.attributes.includes(attribute) ? "1" : "";
      });
      titleLanguageSet.forEach((title: string) => {
        obj[`image ${title}`] = `https://www.kards.com/${image.replace(
          /en-EN/g,
          title
        )}`;
      });
      itemsFormatted.push(obj);
    });

    var fileTitle = "orders"; // or 'my-unique-title'
    exportCSVFile(headers, itemsFormatted, fileTitle);
  };

  if (error) return <p>Error :(</p>;

  const hasNextPage = data ? data.cards.pageInfo.hasNextPage : true;
  const newCards: CardMeta[] = data ? data.cards.edges : [];

  return (
    <div>
      <div>New cards : {newCards.length}</div>
      <div>Total cards : {cards.length}</div>

      {loading && <p>Loading...</p>}
      {!loading && hasNextPage && (
        <button onClick={handleLoadMore}>Load more</button>
      )}
      {!loading && !hasNextPage && (
        <button onClick={generateCSV}>Ready ! Generate generateCSV !</button>
      )}
    </div>
  );
};

export default Loader;
