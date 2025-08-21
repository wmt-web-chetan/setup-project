import React, { useRef } from 'react'
import './SliderComponent.scss'
import Slider from 'react-slick';
import { Button } from 'antd';

const CardSlider = ({ cards, handleCardClick }) => {
  let sliderRef = useRef(null);

  console.log('cardscards', cards)

  const settings = {
    className: "center-slider",
    centerMode: true,
    infinite: true,
    centerPadding: "100px",
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 500,
    autoplay: false,
    autoplaySpeed: 5000,
    dots: false,
    arrows: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          centerPadding: "80px",
        }
      },
      {
        breakpoint: 768,
        settings: {
          centerPadding: "60px",
        }
      },
      {
        breakpoint: 576,
        settings: {
          centerPadding: "10px",
        }
      }
    ]
  };

  const next = () => {
    sliderRef.slickNext();
  };
  const previous = () => {
    sliderRef.slickPrev();
  };

  return (
    <div className="slider-container h-full flex flex-col justify-center items-center relative ">
      <div className='hidden lg:block shadowL absolute p-2 h-full z-20 left-0'></div>
      <div className='hidden lg:block  shadowR absolute p-2 h-full z-20 right-0'></div>
      {/* <div className='block xl:hidden shadowL absolute  h-full z-20 left-0 !w-[3%]'></div>
      <div className='block xl:hddden  shadowR absolute h-full z-20 right-0 !w-[3%]'></div> */}
      <Slider 
      ref={slider => {
        sliderRef = slider;
      }} {...settings}>
        {cards && cards.map((card) => (
          <div className={`slide-item  cursor-pointer ${card.title === "AI Genie" ? 'border border-primary box !rounded-[26px]' : ''}`} key={card.id} onClick={() => handleCardClick(card)}>
            <div className={`feature-card 2xl:!mt-3 w-auto xl:max-w-[900px] ${card.title === "AI Genie" ? "!shadow-none" : "" }`}>
              <div className="card-content ">
                {
                  card.title === "AI Genie" ?
                    <div className="flex justify-center items-center mb-1 sm:mb-4">
                      <Button
                        type="text"
                        className="border-liteGray custom-gradient genButton flex items-center justify-center p-0 w-20 h-20 sm:w-24 sm:h-24"
                        shape="circle"
                        size="large"

                      // onClick={onClickGeinie}
                      >
                        <i
                          className="icon-star flex items-center justify-center text-5xl"
                        // style={{ fontSize: "38px" }}
                        />
                      </Button>
                    </div>
                    :
                    <div className="icon-container !mb-1 sm:!mb-6">
                      <i className={`${card.icon} text-6xl  iconslide `} />
                    </div>
                }
                <h3 className={`${card.title === 'AI Genie' ? '!text-white' : ''} card-title `}>{card.title}</h3>
                <p className="card-description text-sm md:!text-base !text-grayText">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
      <div className="slider-navigation !mt-5 sm:!mt-[46px]">
        <button className="nav-button prev-button !h-12 !w-12 md:!h-16 md:!w-16 !flex !items-center !justify-center" onClick={previous}>
          <i className="icon-back-arrow text-[32px]" />
        </button>
        <button className="nav-button next-button !h-12 !w-12 md:!h-16 md:!w-16 !flex !items-center !justify-center" onClick={next}>
          <i className="icon-back-arrow text-[32px]" />
        </button>
      </div>
    </div>
  )
}

export default CardSlider