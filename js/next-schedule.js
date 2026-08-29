fetch("/api/schedules")
    .then(response => response.json())
    .then(schedules => {

        const list =
            document.querySelector("#next-schedule-list");

        if (!list) {
            return;
        }

        const today = new Date();

        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();


        // 今日以降だけ
        schedules = schedules.filter(schedule => {

            const scheduleDate =
                new Date(
                    year,
                    schedule.month - 1,
                    schedule.day
                );

            const todayDate =
                new Date(
                    year,
                    month - 1,
                    day
                );

            return scheduleDate >= todayDate;

        });


        // 近い順
        schedules.sort((a, b) => {

            const dateA =
                new Date(
                    year,
                    a.month - 1,
                    a.day
                );

            const dateB =
                new Date(
                    year,
                    b.month - 1,
                    b.day
                );

            return dateA - dateB;

        });


        // 最初の3件だけ
        const nextSchedules =
            schedules.slice(0, 3);


        list.innerHTML = "";


        if (nextSchedules.length === 0) {

            list.innerHTML = `
                <p class="schedule-loading">
                    現在、公開されている出船予定はありません。
                </p>
            `;

            return;

        }


        nextSchedules.forEach(schedule => {

            const card =
                document.createElement("article");

            card.className =
                "next-schedule-card";


            let status = "予約情報";


            if (schedule.remaining !== null) {

                if (schedule.remaining <= 0) {

                    status = "満席";

                } else {

                    status =
                        `残り${schedule.remaining}名`;

                }

            }


            const fishingType =
                schedule.fishingType === "不明"
                    ? "釣り物はブログをご確認ください"
                    : schedule.fishingType;


            card.innerHTML = `

                <div class="next-schedule-date">

                    <span>
                        ${schedule.month}月
                    </span>

                    <strong>
                        ${schedule.day}
                    </strong>

                    <small>
                        ${schedule.weekday}
                    </small>

                </div>


                <div class="next-schedule-info">

                    <span>
                        FISHING
                    </span>

                    <h3>
                        ${fishingType}
                    </h3>

                    <p>
                        ${schedule.reserved}名予約中
                    </p>

                </div>


                <div class="next-schedule-status">

                    <strong>
                        ${status}
                    </strong>

                </div>

            `;


            list.appendChild(card);

        });

    })
    .catch(error => {

        console.error(
            "次回出船取得エラー:",
            error
        );

    });