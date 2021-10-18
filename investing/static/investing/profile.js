document.addEventListener('DOMContentLoaded', () => {

    // To follow or unfollow a person
    document.querySelectorAll(".following-btn").forEach(button => {

        button.onclick = () => {
            var status = button.dataset.following;
            let csrftoken = Cookies.get('csrftoken');
            fetch('/change_following', {
                method:'POST',
                body: JSON.stringify({
                    "view_user":view_user,
                    "status": status
                }),
                headers: {"X-CSRFToken": csrftoken}
            })
            .then(response => response.json())
            .then(message => {

                if (message.status === "followed"){
                    var number = parseInt(document.querySelector("#followers").innerHTML);
                    number = number + 1;
                    document.querySelector("#followers").innerHTML = number;
                    document.querySelector(".following-btn").dataset.following = "False";
                    document.querySelector(".following-btn").classList.remove("btn-success");
                    document.querySelector(".following-btn").classList.add("btn-danger");
                    document.querySelector(".following-btn").innerHTML = "Unfollow";
                }
                else {
                    var number = parseInt(document.querySelector("#followers").innerHTML);
                    number = number - 1;
                    document.querySelector("#followers").innerHTML = number;
                    document.querySelector(".following-btn").dataset.following = "True";
                    document.querySelector(".following-btn").classList.remove("btn-danger");
                    document.querySelector(".following-btn").classList.add("btn-success");
                    document.querySelector(".following-btn").innerHTML = "Follow";
                }

            });
        };

    });

});
