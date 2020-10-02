import React, { Component } from 'react';
import "./Cards.css"

class Cards extends Component {

  render() {
    const selected_card = this.props.selected_card;

    return (
      this.props.cards.map((card, idx) => {
        let card_id = 'card' + idx.toString();
        let card_text = '';

        if (typeof card === 'object') {
          if (card.hasOwnProperty('id')) {
            card_id = card['id'];
          }
          if (card.hasOwnProperty('text')) {
            card_text = card['text'];
          } else {
            console.log('Card ' + card_id + ' is missing text attribute, using default text');
            card_text = 'Card ' + card_id;
          }
        } else {
          card_text = String(card);
        }

        return (
          <div id={"card-frame-" + idx.toString()} key={card_id} className={selected_card === idx ? "card-frame-selected" : "card-frame"} >
            <div id={card_id} className={selected_card === idx ? "card-text-selected" : "card-text"} >
              {card_text}
            </div>
          </div>
        );
      })
    );
  }
}

export default Cards
