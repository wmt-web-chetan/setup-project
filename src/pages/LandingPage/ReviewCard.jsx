const ReviewCard = ({ text, name, title, avatar, date }) => (
    <div className="bg-liteGrayV1 border border-liteGray py-4 px-3 rounded-2xl shadow-lg mb-4 flex-col items-start">
      <div className="flex-1 text-start">
        <p className=" text-grayText">{text}</p>
        <div className="flex py-2 items-center">
          {/* <img src={avatar} className="h-8 w-8 rounded-full" alt="" /> */}
          <div className="flex-col p-1 ml-1">
            <div className="text-white font-bold">{name}</div>
            <div className="text-grayText text-[14px] mt-1">{title}</div>
          </div>
        </div>
        <div className="text-grayText text-[14px] mt-0">~{date}</div>
      </div>
    </div>
  );

  export default ReviewCard